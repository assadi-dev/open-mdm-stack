package com.openmdm.agent.enrollment

import com.openmdm.agent.data.DeviceName
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class UsbEnrollmentArgsTest {

    private fun parse(vararg extras: Pair<String, Any?>) = UsbEnrollmentArgs.parse(mapOf(*extras)::get)

    // What the dashboard (and scripts/usb-enroll.sh) sends.
    private val dashboardExtras = arrayOf(
        "deviceName" to "Tablette d'entrepôt 3",
        "groupId" to "nord",
        "policyId" to "kio",
        "serial" to "emulator-5554",
        "autoEnroll" to true,
    )

    @Test
    fun aStartWithoutAnyOfTheParameters_isNotAUsbEnrollment() {
        assertNull(parse())
        assertNull(parse("android.intent.extra.REFERRER" to "x"))
    }

    @Test
    fun theDashboardsParameters_areAllRead() {
        val args = parse(*dashboardExtras)

        assertEquals(
            UsbEnrollmentArgs(
                deviceName = "Tablette d'entrepôt 3",
                groupId = "nord",
                policyId = "kio",
                serial = "emulator-5554",
                autoEnroll = true,
            ),
            args,
        )
    }

    @Test
    fun deviceName_isTrimmedAndCut_andABlankOneIsNoName() {
        assertEquals("Pixel", parse("deviceName" to "  Pixel  ")?.deviceName)
        assertEquals(DeviceName.MAX_LENGTH, parse("deviceName" to "a".repeat(150))?.deviceName?.length)

        val blank = parse("deviceName" to "   ")
        assertNull(blank?.deviceName)
        assertTrue(blank!!.rejected.isEmpty())
    }

    @Test
    fun groupAndPolicy_acceptSlugsAndUuids() {
        val args = parse("groupId" to " lyon ", "policyId" to "0b8f4d2c-6a1e-4f3b-9c7d-5e2a1b3c4d5e")

        assertEquals("lyon", args?.groupId)
        assertEquals("0b8f4d2c-6a1e-4f3b-9c7d-5e2a1b3c4d5e", args?.policyId)
    }

    @Test
    fun anUnusableValue_isDroppedAndReported_withoutLosingTheOthers() {
        val args = parse(*dashboardExtras, "groupId" to "nord; rm -rf /", "serial" to "", "policyId" to 42)

        assertNull(args?.groupId)
        assertNull(args?.serial)
        assertNull(args?.policyId)
        assertEquals(listOf("groupId", "policyId", "serial"), args?.rejected)
        assertEquals("Tablette d'entrepôt 3", args?.deviceName)
        assertTrue(args!!.autoEnroll)
    }

    @Test
    fun serial_acceptsWhatAdbReports() {
        assertEquals("3A1B7K2P", parse("serial" to "3A1B7K2P")?.serial)
        assertEquals("192.168.1.20:5555", parse("serial" to "192.168.1.20:5555")?.serial)
    }

    @Test
    fun autoEnroll_isFalseUnlessAsked() {
        assertFalse(parse("deviceName" to "Pixel")!!.autoEnroll)
        assertFalse(parse("autoEnroll" to false)!!.autoEnroll)
    }

    @Test
    fun autoEnroll_alsoAcceptsTextSentWithEs() {
        assertTrue(parse("autoEnroll" to "true")!!.autoEnroll)
        assertTrue(parse("autoEnroll" to " TRUE ")!!.autoEnroll)

        val wrong = parse("autoEnroll" to "yes")!!
        assertFalse(wrong.autoEnroll)
        assertEquals(listOf("autoEnroll"), wrong.rejected)
    }
}
