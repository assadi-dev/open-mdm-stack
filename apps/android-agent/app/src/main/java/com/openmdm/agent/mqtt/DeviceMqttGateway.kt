package com.openmdm.agent.mqtt

import android.util.Log
import com.hivemq.client.mqtt.MqttClient
import com.hivemq.client.mqtt.datatypes.MqttQos
import com.hivemq.client.mqtt.mqtt5.Mqtt5AsyncClient
import com.openmdm.agent.BuildConfig
import com.openmdm.agent.data.local.SecureDeviceStore
import java.net.URI
import java.nio.charset.StandardCharsets
import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

enum class MqttConnectionState { DISCONNECTED, CONNECTING, CONNECTED }

/**
 * Backend transport for remote commands and presence (see
 * apps/api/src/lib/mqtt.ts and dependencies/emqx/). Connects as the enrolled
 * device: `clientId = deviceId`, `username = deviceId`,
 * `password = <device JWT>` — the same credential already used for REST
 * calls (see [com.openmdm.agent.data.remote.AuthInterceptor]). EMQX validates
 * it against `POST /api/v1/mqtt/auth`; the ACL in `acl.conf` then scopes this
 * connection to its own `mdm/devices/{id}/#` subtree.
 *
 * Presence: a retained "online" is published right after CONNECT, and a
 * retained Last Will "offline" is registered on that same CONNECT so the
 * broker publishes it itself if this device disappears without a clean
 * disconnect (network loss, battery pull, process kill) — no heartbeat
 * needed for that.
 *
 * Commands: after every successful (re)connect, this also (re)subscribes to
 * `mdm/devices/{id}/commands` (QoS 1) and republishes decoded messages on
 * [commands] for [CommandExecutor]/[MqttConnectionService] to run and ack —
 * this class stays transport-only, same split as the backend's
 * `mqttGateway`/`CommandService`.
 */
class DeviceMqttGateway(private val store: SecureDeviceStore) {

    private val json = Json { ignoreUnknownKeys = true }

    private var client: Mqtt5AsyncClient? = null

    /** Identity the current [client] was built for — see [connect]'s re-enrollment check. */
    private var connectedDeviceId: String? = null

    private val _connectionState = MutableStateFlow(MqttConnectionState.DISCONNECTED)
    val connectionState: StateFlow<MqttConnectionState> = _connectionState.asStateFlow()

    // Buffered so a burst of commands right at (re)connect — e.g. everything
    // that queued up while this device was offline — isn't dropped waiting
    // for the collector in MqttConnectionService to keep up.
    private val _commands = MutableSharedFlow<IncomingCommand>(extraBufferCapacity = 16)
    val commands: SharedFlow<IncomingCommand> = _commands.asSharedFlow()

    /**
     * Idempotent for a given device identity: a second call while already
     * connecting/connected as the same device is a no-op. If the stored
     * identity changed since (re-enrollment issued a new deviceId/token
     * while a connection or a stale automaticReconnect loop was still up),
     * the old client — built with credentials the broker will now reject
     * outright — is torn down first.
     */
    suspend fun connect() {
        val deviceId = store.deviceId
        val deviceToken = store.deviceToken
        val host = resolveBrokerHost()
        if (deviceId == null || deviceToken == null || host == null) {
            Log.w(TAG, "Cannot connect: device not enrolled or broker host unknown")
            return
        }

        if (client != null) {
            if (connectedDeviceId == deviceId) return
            Log.i(TAG, "Device identity changed ($connectedDeviceId -> $deviceId), reconnecting")
            disconnect()
        }
        connectedDeviceId = deviceId

        _connectionState.value = MqttConnectionState.CONNECTING

        val statusTopic = MqttTopics.status(deviceId)
        val onlinePayload = statusPayload(DeviceStatusPayload.ONLINE)
        val offlinePayload = statusPayload(DeviceStatusPayload.OFFLINE)

        // simpleAuth and willPublish are set here, on the CLIENT builder, not
        // on the one-off connectWith() call below: automaticReconnect fires
        // its own internal reconnect attempts that never go through
        // connectWith() again, so anything configured only there (auth
        // included) is silently dropped on every automatic reconnect —
        // confirmed the hard way: the very first connect succeeded, but the
        // first reconnect after a network blip came back NOT_AUTHORIZED
        // because it carried no credentials at all. Config set at this
        // client-builder level is reused for every attempt, manual or
        // automatic.
        val mqttClient = MqttClient.builder()
            .useMqttVersion5()
            .identifier(deviceId)
            .serverHost(host)
            .serverPort(MQTT_PORT)
            .simpleAuth()
            .username(deviceId)
            .password(deviceToken.toByteArray(StandardCharsets.UTF_8))
            .applySimpleAuth()
            .willPublish()
            .topic(statusTopic)
            .qos(MqttQos.AT_LEAST_ONCE)
            .retain(true)
            .payload(offlinePayload)
            .applyWillPublish()
            .automaticReconnect()
            .initialDelay(2, TimeUnit.SECONDS)
            .maxDelay(60, TimeUnit.SECONDS)
            .applyAutomaticReconnect()
            .addConnectedListener {
                Log.i(TAG, "MQTT connected to $host:$MQTT_PORT")
                _connectionState.value = MqttConnectionState.CONNECTED
                publishRetained(statusTopic, onlinePayload)
                // Re-issued on every (re)connect, not just the first: a
                // duplicate SUBSCRIBE for the same filter is harmless, and
                // this removes any doubt about whether the library's session
                // resume alone would have covered it (see the simpleAuth/
                // willPublish comment above for why doubt is warranted here).
                subscribeToCommands(deviceId)
            }
            .addDisconnectedListener { context ->
                Log.w(TAG, "MQTT disconnected: ${context.cause.message}")
                // automaticReconnect keeps retrying underneath; reflect that
                // as CONNECTING rather than a final DISCONNECTED.
                _connectionState.value = MqttConnectionState.CONNECTING
            }
            .build()
            .toAsync()
        client = mqttClient

        try {
            mqttClient.connectWith()
                .cleanStart(false)
                .sessionExpiryInterval(SESSION_EXPIRY_SECONDS)
                .keepAlive(KEEP_ALIVE_SECONDS)
                .send()
                .await()
        } catch (e: Exception) {
            Log.e(TAG, "MQTT connect failed", e)
            _connectionState.value = MqttConnectionState.DISCONNECTED
            client = null
            connectedDeviceId = null
            throw e
        }
    }

    /**
     * Graceful shutdown: publishes "offline" itself (retained, same payload
     * as the Last Will) so the status flips immediately instead of waiting
     * for the broker to notice the dropped connection, then disconnects
     * cleanly. Skipped entirely if the process is killed instead (kill -9,
     * battery pull) — that's exactly when the Last Will registered in
     * [connect] takes over.
     */
    suspend fun disconnect() {
        val mqttClient = client ?: return
        // The identity the *current* client authenticated as — not
        // store.deviceId, which may already hold a newer one (see the
        // re-enrollment path in [connect]).
        val deviceId = connectedDeviceId
        try {
            if (deviceId != null) {
                publishRetained(MqttTopics.status(deviceId), statusPayload(DeviceStatusPayload.OFFLINE)).await()
            }
            mqttClient.disconnect().await()
        } catch (e: Exception) {
            Log.w(TAG, "MQTT disconnect failed", e)
        } finally {
            client = null
            connectedDeviceId = null
            _connectionState.value = MqttConnectionState.DISCONNECTED
        }
    }

    /**
     * Reports the lock-screen state (retained) on `mdm/devices/{id}/screen` —
     * see [ScreenLockReporter]. Returns whether it was actually published:
     * the caller dedupes on its last *reported* value, so a silent no-op
     * here (not connected yet, e.g. right at service startup) must not be
     * mistaken for success — that would permanently skip the next real
     * change, believing it was already sent.
     */
    suspend fun publishScreenState(locked: Boolean): Boolean {
        val deviceId = connectedDeviceId
        if (deviceId == null || _connectionState.value != MqttConnectionState.CONNECTED) {
            Log.w(TAG, "Cannot report screen state: not connected")
            return false
        }
        return try {
            publishRetained(MqttTopics.screen(deviceId), screenPayload(locked)).await()
            true
        } catch (e: Exception) {
            Log.w(TAG, "Failed to report screen state", e)
            false
        }
    }

    /** Sends a command ack on `mdm/devices/{id}/acks` (not retained — a log of events, not a snapshot). */
    suspend fun ackCommand(ack: CommandAck) {
        val deviceId = connectedDeviceId
        if (deviceId == null) {
            Log.w(TAG, "Cannot ack ${ack.commandId}: not connected")
            return
        }
        publish(MqttTopics.acks(deviceId), json.encodeToString(ack).toByteArray(StandardCharsets.UTF_8), retain = false)
            .await()
    }

    private fun subscribeToCommands(deviceId: String) {
        val mqttClient = client ?: return
        mqttClient.subscribeWith()
            .topicFilter(MqttTopics.commands(deviceId))
            .qos(MqttQos.AT_LEAST_ONCE)
            .callback { publish ->
                val command = runCatching {
                    json.decodeFromString<IncomingCommand>(
                        String(publish.payloadAsBytes, StandardCharsets.UTF_8),
                    )
                }.getOrNull()
                if (command != null) {
                    _commands.tryEmit(command)
                } else {
                    Log.w(TAG, "Dropping malformed message on ${publish.topic}")
                }
            }
            .send()
            .whenComplete { _, error ->
                if (error != null) Log.e(TAG, "Failed to subscribe to commands", error)
            }
    }

    private fun statusPayload(state: String): ByteArray =
        json.encodeToString(DeviceStatusPayload(state)).toByteArray(StandardCharsets.UTF_8)

    private fun screenPayload(locked: Boolean): ByteArray =
        json.encodeToString(DeviceScreenPayload(locked)).toByteArray(StandardCharsets.UTF_8)

    private fun publishRetained(topic: String, payload: ByteArray): CompletableFuture<*> =
        publish(topic, payload, retain = true)

    private fun publish(topic: String, payload: ByteArray, retain: Boolean): CompletableFuture<*> {
        val mqttClient = client ?: return CompletableFuture.completedFuture(null)
        return mqttClient.publishWith()
            .topic(topic)
            .qos(MqttQos.AT_LEAST_ONCE)
            .retain(retain)
            .payload(payload)
            .send()
            .whenComplete { _, error ->
                if (error != null) Log.w(TAG, "Failed to publish on $topic", error)
            }
    }

    /**
     * The broker runs on the same host as the REST API (see
     * dependencies/compose.yml) on its own port — only the host is reused
     * from the configured server base URL, which a device-provided QR may
     * have overridden (see [SecureDeviceStore.serverBaseUrl]).
     */
    private fun resolveBrokerHost(): String? = try {
        URI(store.serverBaseUrl?.takeIf { it.isNotBlank() } ?: BuildConfig.MDM_SERVER_URL).host
    } catch (e: Exception) {
        Log.e(TAG, "Cannot resolve MQTT broker host", e)
        null
    }

    private companion object {
        const val TAG = "DeviceMqttGateway"
        const val MQTT_PORT = 1883
        const val KEEP_ALIVE_SECONDS = 30
        // 1 day, matches mqtt.session_expiry_interval in dependencies/emqx/emqx.conf.
        const val SESSION_EXPIRY_SECONDS = 60L * 60 * 24
    }
}

/** Bridges a HiveMQ client CompletableFuture into a suspend call. */
private suspend fun <T> CompletableFuture<T>.await(): T = suspendCancellableCoroutine { cont ->
    whenComplete { value, error ->
        if (error != null) cont.resumeWithException(error) else cont.resume(value)
    }
    cont.invokeOnCancellation { cancel(true) }
}
