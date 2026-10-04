package com.openmdm.agent.ui

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class EnrollmentQrParserTest {

    // What apps/api's buildProvisioningPayload emits for a QR generated with a device name.
    private val provisioningQr = """
        {
          "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME": "com.openmdm.agent",
          "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            "serverBaseUrl": "http://10.0.0.5:5573",
            "policyId": "std",
            "groupId": "lyon",
            "name": "Terrain-Lyon"
          },
          "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": false
        }
    """.trimIndent()

    @Test
    fun provisioningQr_readsTheServerUrlAndTheName() {
        val result = EnrollmentQrParser.parse(provisioningQr)

        assertEquals("http://10.0.0.5:5573", result?.baseUrl)
        assertEquals("Terrain-Lyon", result?.name)
    }

    @Test
    fun provisioningQr_withoutAName_hasNone() {
        val qr = """{"android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE":{"serverBaseUrl":"http://10.0.0.5:5573"}}"""

        val result = EnrollmentQrParser.parse(qr)

        assertEquals("http://10.0.0.5:5573", result?.baseUrl)
        assertNull(result?.name)
    }

    @Test
    fun provisioningQr_withANameOfTheWrongType_keepsTheServerUrl() {
        val qr = """{"android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE":{"serverBaseUrl":"http://10.0.0.5:5573","name":{"a":1}}}"""

        val result = EnrollmentQrParser.parse(qr)

        assertEquals("http://10.0.0.5:5573", result?.baseUrl)
        assertNull(result?.name)
    }

    @Test
    fun plainJson_readsTheServerUrlAndTheName() {
        val result = EnrollmentQrParser.parse("""{"serverBaseUrl":"http://10.0.0.5:5573","name":"Entrepôt 3"}""")

        assertEquals("http://10.0.0.5:5573", result?.baseUrl)
        assertEquals("Entrepôt 3", result?.name)
    }

    @Test
    fun bareString_isTheServerUrlWithoutAName() {
        val result = EnrollmentQrParser.parse("  http://10.0.0.5:5573 ")

        assertEquals("http://10.0.0.5:5573", result?.baseUrl)
        assertNull(result?.name)
    }

    @Test
    fun jsonWithoutAServerUrl_isRejected() {
        assertNull(EnrollmentQrParser.parse("""{"name":"Terrain-Lyon"}"""))
        assertNull(EnrollmentQrParser.parse("{not json"))
        assertNull(EnrollmentQrParser.parse("   "))
    }
}
