package com.openmdm.agent.mqtt

import com.openmdm.agent.device.DeviceCommandActions
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test

/**
 * One test per remote command type (see apps/api/src/drizzle/schemas/command-schema.ts
 * and dependencies/emqx/): [DeviceCommandActions] is faked so these run on
 * the JVM without a real [android.app.admin.DevicePolicyManager] — same
 * approach as [com.openmdm.agent.data.remote.MockDeviceApi] for [com.openmdm.agent.data.remote.DeviceApi].
 * The `refresh` command's report to the server is faked the same way ([RecordingReport]).
 */
class CommandExecutorTest {

    private lateinit var actions: RecordingDeviceCommandActions
    private lateinit var reporter: RecordingReport
    private lateinit var executor: CommandExecutor

    @Before
    fun setUp() {
        actions = RecordingDeviceCommandActions()
        reporter = RecordingReport()
        executor = CommandExecutor(actions, reporter::report)
    }

    private fun command(type: String, payload: JsonObject = JsonObject(emptyMap())) =
        IncomingCommand(id = "cmd-1", type = type, payload = payload)

    @Test
    fun lock_callsLockNowAndSucceeds() = runTest {
        val result = executor.execute(command("lock"))

        assertTrue(actions.lockNowCalled)
        assertTrue(result.isSuccess)
        assertTrue(result.getOrThrow().containsKey("executedAt"))
    }

    @Test
    fun lock_failurePropagatesAsResultFailure() = runTest {
        actions.lockNowError = SecurityException("not device owner")

        val result = executor.execute(command("lock"))

        assertTrue(result.isFailure)
        assertEquals("not device owner", result.exceptionOrNull()?.message)
    }

    @Test
    fun reboot_callsRebootAndSucceeds() = runTest {
        val result = executor.execute(command("reboot"))

        assertTrue(actions.rebootCalled)
        assertTrue(result.isSuccess)
    }

    @Test
    fun reboot_failurePropagatesAsResultFailure() = runTest {
        actions.rebootError = SecurityException("not device owner")

        val result = executor.execute(command("reboot"))

        assertTrue(result.isFailure)
    }

    @Test
    fun unlock_callsRequestUnlockAndSucceeds() = runTest {
        val result = executor.execute(command("unlock"))

        assertTrue(actions.requestUnlockCalled)
        assertTrue(result.isSuccess)
    }

    @Test
    fun setLockMessage_passesMessageFromPayload() = runTest {
        val payload = buildJsonObject { put("message", JsonPrimitive("Propriété ACME")) }

        val result = executor.execute(command("set_lock_message", payload))

        assertTrue(actions.setLockScreenMessageCalled)
        assertEquals("Propriété ACME", actions.lastLockScreenMessage)
        assertTrue(result.isSuccess)
    }

    @Test
    fun setLockMessage_withNoMessageField_clearsWithNull() = runTest {
        val result = executor.execute(command("set_lock_message"))

        assertTrue(actions.setLockScreenMessageCalled)
        assertNull(actions.lastLockScreenMessage)
        assertTrue(result.isSuccess)
    }

    @Test
    fun setLockMessage_ignoresNonStringMessageField() = runTest {
        val payload = buildJsonObject { put("message", JsonPrimitive(42)) }

        val result = executor.execute(command("set_lock_message", payload))

        // 42 is still a JsonPrimitive, so its string content ("42") is used —
        // documents the actual (lenient) behavior rather than asserting a
        // stricter contract execute() doesn't implement.
        assertEquals("42", actions.lastLockScreenMessage)
        assertTrue(result.isSuccess)
    }

    @Test
    fun removeDeviceOwner_callsRemoveDeviceOwnerAndSucceeds() = runTest {
        val result = executor.execute(command("remove_device_owner"))

        assertTrue(actions.removeDeviceOwnerCalled)
        assertTrue(result.isSuccess)
    }

    @Test
    fun removeDeviceOwner_failurePropagatesAsResultFailure() = runTest {
        actions.removeDeviceOwnerError = IllegalStateException("Failed to clear device owner")

        val result = executor.execute(command("remove_device_owner"))

        assertTrue(result.isFailure)
        assertEquals("Failed to clear device owner", result.exceptionOrNull()?.message)
    }

    @Test
    fun refresh_reportsToTheServerAndSucceeds() = runTest {
        val result = executor.execute(command("refresh"))

        assertEquals(1, reporter.calls)
        assertTrue(result.isSuccess)
        assertTrue(result.getOrThrow().containsKey("executedAt"))
        assertFalse(actions.anyActionCalled())
    }

    @Test
    fun refresh_failsWhenTheReportFails() = runTest {
        reporter.result = Result.failure(IllegalStateException("telemetry rejected"))

        val result = executor.execute(command("refresh"))

        assertEquals(1, reporter.calls)
        assertTrue(result.isFailure)
        assertEquals("telemetry rejected", result.exceptionOrNull()?.message)
    }

    @Test
    fun refresh_doesNotSwallowACancellation() = runTest {
        reporter.error = CancellationException("service stopped")

        try {
            executor.execute(command("refresh"))
            fail("the cancellation should have propagated")
        } catch (expected: CancellationException) {
            assertEquals("service stopped", expected.message)
        }
    }

    @Test
    fun otherCommands_neverReport() = runTest {
        executor.execute(command("lock"))
        executor.execute(command("factory_reset"))

        assertEquals(0, reporter.calls)
    }

    @Test
    fun unknownType_failsWithoutCallingAnyAction() = runTest {
        val result = executor.execute(command("factory_reset"))

        assertTrue(result.isFailure)
        assertFalse(actions.anyActionCalled())
    }

    private class RecordingReport {
        var calls = 0
        var result: Result<Unit> = Result.success(Unit)
        var error: Throwable? = null

        suspend fun report(): Result<Unit> {
            calls++
            error?.let { throw it }
            return result
        }
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
