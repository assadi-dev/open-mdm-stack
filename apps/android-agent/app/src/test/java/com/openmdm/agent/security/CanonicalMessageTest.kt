package com.openmdm.agent.security

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

/**
 * Verifies the exact field order/joiner against the server's
 * `generateCanonicalMessage` (apps/api/src/features/enrollment/utils/canonical-message.ts):
 *
 *   model|manufacturer|release|serialNumber|imei|macAddress|androidId|method|timestamp|publicKey|challenge
 *
 * with an absent optional field rendered as an empty string (never omitted,
 * never the literal "null" — matching `request[field] ?? ""` server-side).
 */
class CanonicalMessageTest {

    @Test
    fun build_joinsAllElevenFieldsInServerOrder() {
        val message = CanonicalMessage.build(
            model = "Pixel 8",
            manufacturer = "Google",
            release = "14",
            serialNumber = "SER123",
            imei = "IMEI456",
            macAddress = "AA:BB:CC:DD:EE:FF",
            androidId = "abc123def456",
            method = "manual",
            timestamp = "2026-01-01T00:00:00.000Z",
            publicKey = "cHVibGljS2V5",
            challenge = "chal-1",
        )

        assertEquals(
            "Pixel 8|Google|14|SER123|IMEI456|AA:BB:CC:DD:EE:FF|abc123def456|manual|" +
                "2026-01-01T00:00:00.000Z|cHVibGljS2V5|chal-1",
            message,
        )
    }

    @Test
    fun build_rendersAbsentOptionalFieldsAsEmptyStringNotNullOrOmitted() {
        val message = CanonicalMessage.build(
            model = "Pixel 8",
            manufacturer = "Google",
            release = "14",
            serialNumber = null,
            imei = null,
            macAddress = null,
            androidId = null,
            method = null,
            timestamp = "2026-01-01T00:00:00.000Z",
            publicKey = "cHVibGljS2V5",
            challenge = "chal-1",
        )

        assertEquals(
            "Pixel 8|Google|14||||||2026-01-01T00:00:00.000Z|cHVibGljS2V5|chal-1",
            message,
        )
        assertFalse(message.contains("null"))
    }
}
