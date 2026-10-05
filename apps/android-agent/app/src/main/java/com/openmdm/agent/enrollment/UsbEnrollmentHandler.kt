package com.openmdm.agent.enrollment

import android.content.Context
import android.util.Log
import android.widget.Toast
import com.openmdm.agent.data.local.SecureDeviceStore
import com.openmdm.agent.work.MdmWork

/**
 * Handles the parameters of a USB enrollment ([UsbEnrollmentArgs]), one after the other:
 *
 *  1. `deviceName` — saved in the local store, and sent to the server with the enrollment;
 *  2. `groupId`    — saved in the local store (the server has no groups yet);
 *  3. `policyId`   — saved in the local store (the server has no policies yet);
 *  4. `serial`     — saved in the local store, used by the enrollment in case the device can't read its own;
 *  5. `autoEnroll` — saved in the local store while it is `true`, and then enrolls in the background
 *                    ([MdmWork.enqueueEnrollment], method `usb`), so the enrollment survives the dashboard closing the
 *                    ADB session or the screen going off. The screen then greys the code input and offers a switch to
 *                    turn it off; its button enrolls by itself again if the first attempt failed. Otherwise the
 *                    person enrolls with a code from the screen, which reuses what was saved here (see
 *                    [com.openmdm.agent.ui.AgentViewModel.enroll]).
 *
 * Every step logs what it did under [TAG] (`adb logcat -s UsbEnrollment`), to follow a test from the command line.
 */
class UsbEnrollmentHandler(
    private val context: Context,
    private val store: SecureDeviceStore,
) {

    fun handle(args: UsbEnrollmentArgs) {
        Log.i(TAG, "USB enrollment parameters received: $args")
        args.rejected.forEach { Log.w(TAG, "Ignored extra '$it': unusable value") }

        // 1. deviceName — saved, then sent with the enrollment. An absent, blank or rejected value leaves the one
        //    already saved, like the group and the policy.
        args.deviceName?.let {
            store.deviceName = it
            Log.i(TAG, "deviceName: \"$it\", saved")
        } ?: Log.i(TAG, "deviceName: none, unchanged (${store.deviceName ?: "—"})")

        // 2. groupId — same rule.
        args.groupId?.let {
            store.groupId = it
            Log.i(TAG, "groupId: $it, saved")
        } ?: Log.i(TAG, "groupId: none, unchanged (${store.groupId ?: "—"})")

        // 3. policyId — same rule.
        args.policyId?.let {
            store.policyId = it
            Log.i(TAG, "policyId: $it, saved")
        } ?: Log.i(TAG, "policyId: none, unchanged (${store.policyId ?: "—"})")

        // 4. serial — same rule.
        args.serial?.let {
            store.usbSerial = it
            Log.i(TAG, "serial: $it, saved, used if the device can't read its own")
        } ?: Log.i(TAG, "serial: none, unchanged (${store.usbSerial ?: "—"})")

        // Whatever the parameters, the next enrollment is a USB one (cleared once an enrollment succeeds). `autoEnroll`
        // is stored as received: a start with `false` turns off one left by an earlier start.
        if (!store.isEnrolled) {
            store.usbEnrollmentPending = true
            store.autoEnroll = args.autoEnroll
        }

        // 5. autoEnroll
        when {
            !args.autoEnroll -> Log.i(TAG, "autoEnroll: false, waiting for an enrollment with a code from the screen")
            // A re-run of the dashboard (or of the script) must not enroll the device a second time.
            store.isEnrolled -> {
                Log.i(TAG, "autoEnroll: true, but the device is already enrolled (${store.deviceId}): skipped")
                toast("Appareil déjà enrôlé")
            }
            else -> {
                Log.i(TAG, "autoEnroll: true, enrollment queued")
                // No server URL among the parameters: the enrollment keeps the saved or built-in one.
                MdmWork.enqueueEnrollment(
                    context = context.applicationContext,
                    baseUrl = null,
                    enrollmentMethod = MdmWork.METHOD_USB,
                    name = args.deviceName,
                    serial = args.serial,
                )
                toast("Enrôlement USB en cours…")
            }
        }
    }

    private fun toast(message: String) = Toast.makeText(context, message, Toast.LENGTH_SHORT).show()

    private companion object {
        const val TAG = "UsbEnrollment"
    }
}
