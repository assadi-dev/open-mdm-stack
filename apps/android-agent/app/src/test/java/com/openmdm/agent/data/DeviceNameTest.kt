package com.openmdm.agent.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DeviceNameTest {

    @Test
    fun aMissingOrBlankName_isNull() {
        assertNull(DeviceName.normalize(null))
        assertNull(DeviceName.normalize(""))
        assertNull(DeviceName.normalize("   \t\n"))
    }

    @Test
    fun theNameIsTrimmed() {
        assertEquals("Terrain-Lyon", DeviceName.normalize("  Terrain-Lyon \n"))
    }

    @Test
    fun aLongNameIsCutToTheServersLimit() {
        val result = DeviceName.normalize("a".repeat(DeviceName.MAX_LENGTH + 40))

        assertEquals("a".repeat(DeviceName.MAX_LENGTH), result)
    }

    @Test
    fun theCutDoesNotLeaveATrailingSpace() {
        val raw = "a".repeat(DeviceName.MAX_LENGTH - 1) + " b"

        assertEquals("a".repeat(DeviceName.MAX_LENGTH - 1), DeviceName.normalize(raw))
    }

    @Test
    fun theCutDoesNotSplitAnEmoji() {
        // "😀" is two chars (a surrogate pair): cutting between them would leave an invalid lone surrogate.
        val raw = "a".repeat(DeviceName.MAX_LENGTH - 1) + "😀"

        assertEquals("a".repeat(DeviceName.MAX_LENGTH - 1), DeviceName.normalize(raw))
    }

    @Test
    fun anAccentedNameIsKept() {
        assertEquals("Entrepôt Nord 3", DeviceName.normalize("Entrepôt Nord 3"))
    }
}
