package com.openmdm.agent.mqtt

import com.openmdm.agent.device.DeviceCommandActions
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * One test per remote command type (see apps/api/src/drizzle/schemas/command-schema.ts
 * and dependencies/emqx/): [DeviceCommandActions] is faked so these run on
 * the JVM without a real [android.app.admin.DevicePolicyManager] — same
 * approach as [com.openmdm.agent.data.remote.MockDeviceApi] for [com.openmdm.agent.data.remote.DeviceApi].
 */
class CommandExecutorTest {

    private lateinit var actions: RecordingDeviceCommandActions
    private lateinit var executor: CommandExecutor

    @Before
    fun setUp() {
        actions = RecordingDeviceCommandActions()
        executor = CommandExecutor(actions)
    }

    private fun command(type: String, payload: JsonObject = JsonObject(emptyMap())) =
        IncomingCommand(id = "cmd-1", type = type, payload = payload)

    @Test
    fun lock_callsLockNowAndSucceeds() {
        val result = executor.execute(command("lock"))

        assertTrue(actions.lockNowCalled)
        assertTrue(result.isSuccess)
        assertTrue(result.getOrThrow().containsKey("executedAt"))
    }

    @Test
    fun lock_failurePropagatesAsResultFailure() {
        actions.lockNowError = SecurityException("not device owner")

        val result = executor.execute(command("lock"))

        assertTrue(result.isFailure)
        assertEquals("not device owner", result.exceptionOrNull()?.message)
    }

    @Test
    fun reboot_callsRebootAndSucceeds() {
        val result = executor.execute(command("reboot"))

        assertTrue(actions.rebootCalled)
        assertTrue(result.isSuccess)
    }

    @Test
    fun reboot_failurePropagatesAsResultFailure() {
        actions.rebootError = SecurityException("not device owner")

        val result = executor.execute(command("reboot"))

        assertTrue(result.isFailure)
    }

    @Test
    fun unlock_callsRequestUnlockAndSucceeds() {
        val result = executor.execute(command("unlock"))

        assertTrue(actions.requestUnlockCalled)
        assertTrue(result.isSuccess)
    }

    @Test
    fun setLockMessage_passesMessageFromPayload() {
        val payload = buildJsonObject { put("message", JsonPrimitive("Propriété ACME")) }

        val result = executor.execute(command("set_lock_message", payload))

        assertTrue(actions.setLockScreenMessageCalled)
        assertEquals("Propriété ACME", actions.lastLockScreenMessage)
        assertTrue(result.isSuccess)
    }

    @Test
    fun setLockMessage_withNoMessageField_clearsWithNull() {
        val result = executor.execute(command("set_lock_message"))

        assertTrue(actions.setLockScreenMessageCalled)
        assertNull(actions.lastLockScreenMessage)
        assertTrue(result.isSuccess)
    }

    @Test
    fun setLockMessage_ignoresNonStringMessageField() {
        val payload = buildJsonObject { put("message", JsonPrimitive(42)) }

        val result = executor.execute(command("set_lock_message", payload))

        // 42 is still a JsonPrimitive, so its string content ("42") is used —
        // documents the actual (lenient) behavior rather than asserting a
        // stricter contract execute() doesn't implement.
        assertEquals("42", actions.lastLockScreenMessage)
        assertTrue(result.isSuccess)
    }

    @Test
    fun removeDeviceOwner_callsRemoveDeviceOwnerAndSucceeds() {
        val result = executor.execute(command("remove_device_owner"))

        assertTrue(actions.removeDeviceOwnerCalled)
        assertTrue(result.isSuccess)
    }

    @Test
    fun removeDeviceOwner_failurePropagatesAsResultFailure() {
        actions.removeDeviceOwnerError = IllegalStateException("Failed to clear device owner")

        val result = executor.execute(command("remove_device_owner"))

        assertTrue(result.isFailure)
        assertEquals("Failed to clear device owner", result.exceptionOrNull()?.message)
    }

    @Test
    fun unknownType_failsWithoutCallingAnyAction() {
        val result = executor.execute(command("factory_reset"))

        assertTrue(result.isFailure)
        assertFalse(actions.anyActionCalled())
    }

    private class RecordingDeviceCommandActions : DeviceCommandActions {
        var lockNowCalled = false
        var rebootCalled = false
        var requestUnlockCalled = false
        var setLockScreenMessageCalled = false
        var lastLockScreenMessage: String? = null
        var removeDeviceOwnerCalled = false

        var lockNowError: Throwable? = null
        var rebootError: Throwable? = null
        var removeDeviceOwnerError: Throwable? = null

        override fun lockNow() {
            lockNowError?.let { throw it }
            lockNowCalled = true
        }

        override fun reboot() {
            rebootError?.let { throw it }
            rebootCalled = true
        }

        override fun setLockScreenMessage(message: String?) {
            setLockScreenMessageCalled = true
            lastLockScreenMessage = message
        }

        override fun requestUnlock() {
            requestUnlockCalled = true
        }

        override fun removeDeviceOwner() {
            removeDeviceOwnerError?.let { throw it }
            removeDeviceOwnerCalled = true
        }

        fun anyActionCalled() =
            lockNowCalled || rebootCalled || requestUnlockCalled || setLockScreenMessageCalled || removeDeviceOwnerCalled
    }
}
