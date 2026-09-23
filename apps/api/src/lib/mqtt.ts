import mqtt, { MqttClient } from "mqtt";
import { ENV } from "@config/env";

const TOPIC_ROOT = "mdm/devices";
const PUBLISH_TIMEOUT_MS = 5_000;

export const mqttTopics = {
    commands: (deviceId: string) => `${TOPIC_ROOT}/${deviceId}/commands`,
    allAcks: `${TOPIC_ROOT}/+/acks`,
    allStatus: `${TOPIC_ROOT}/+/status`,
    allScreen: `${TOPIC_ROOT}/+/screen`,
};

export type DeviceMessageKind = "acks" | "status" | "screen";

/** Extracts the device id from mdm/devices/{id}/(acks|status|screen); null for anything else. */
export const parseDeviceTopic = (topic: string): { deviceId: string; kind: DeviceMessageKind } | null => {
    const match = /^mdm\/devices\/([^/]+)\/(acks|status|screen)$/.exec(topic);
    if (!match) return null;
    return { deviceId: match[1], kind: match[2] as DeviceMessageKind };
};

type DeviceMessageHandler = (deviceId: string, kind: DeviceMessageKind, payload: unknown) => Promise<void>;
type ConnectHandler = () => Promise<void>;

/**
 * Backend side of the MQTT transport. Connects to EMQX as superuser with a
 * persistent session (clean: false) so device acks/status published while the
 * API is down are delivered on reconnect.
 *
 * Only publishes while connected: a command published offline would sit in
 * mqtt.js' queue and block the HTTP request. Undelivered commands stay
 * `pending` in Postgres and are flushed on reconnect (see onConnect).
 */
class MqttGateway {
    private client: MqttClient | null = null;
    private messageHandler: DeviceMessageHandler | null = null;
    private connectHandler: ConnectHandler | null = null;

    get connected(): boolean {
        return this.client?.connected ?? false;
    }

    onDeviceMessage(handler: DeviceMessageHandler) {
        this.messageHandler = handler;
    }

    onConnect(handler: ConnectHandler) {
        this.connectHandler = handler;
    }

    start() {
        if (this.client) return;

        const client = mqtt.connect(ENV.MQTT_URL, {
            clientId: ENV.MQTT_CLIENT_ID,
            username: ENV.MQTT_BACKEND_USERNAME,
            password: ENV.MQTT_BACKEND_PASSWORD,
            clean: false,
            reconnectPeriod: 5_000,
            // EMQX answers "Not authorized" while its auth webhook to this API
            // is still (re)connecting, e.g. right after an API restart: keep retrying.
            reconnectOnConnackError: true,
        });
        this.client = client;

        client.on("connect", async (connack) => {
            console.log(`✅ MQTT connected to ${ENV.MQTT_URL} (sessionPresent=${connack.sessionPresent})`);
            try {
                await client.subscribeAsync([mqttTopics.allAcks, mqttTopics.allStatus, mqttTopics.allScreen], { qos: 1 });
                await this.connectHandler?.();
            } catch (error) {
                console.error("MQTT post-connect setup failed", error);
            }
        });

        client.on("message", (topic, message) => {
            const parsed = parseDeviceTopic(topic);
            if (!parsed || !this.messageHandler) return;

            let payload: unknown;
            try {
                payload = JSON.parse(message.toString("utf8"));
            } catch {
                console.warn(`MQTT: dropping non-JSON message on ${topic}`);
                return;
            }
            this.messageHandler(parsed.deviceId, parsed.kind, payload).catch((error) => {
                console.error(`MQTT: failed to handle message on ${topic}`, error);
            });
        });

        client.on("error", (error) => console.error("MQTT error:", error.message));
        client.on("offline", () => console.warn("MQTT offline, retrying..."));
    }

    /** Publishes JSON at QoS 1. Returns false (without queueing) when the broker is unreachable. */
    async publishJson(topic: string, body: unknown): Promise<boolean> {
        if (!this.client || !this.client.connected) return false;

        let timer: NodeJS.Timeout | undefined;
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error(`MQTT publish timeout on ${topic}`)), PUBLISH_TIMEOUT_MS);
        });
        try {
            await Promise.race([this.client.publishAsync(topic, JSON.stringify(body), { qos: 1 }), timeout]);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        } finally {
            clearTimeout(timer);
        }
    }

    async stop() {
        await this.client?.endAsync();
        this.client = null;
    }
}

export const mqttGateway = new MqttGateway();
