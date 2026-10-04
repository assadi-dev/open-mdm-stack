package com.openmdm.agent.ui

import com.openmdm.agent.data.repository.OtpVerifyException
import java.io.IOException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class EnrollmentMessageTest {

    @Test
    fun aSuccessIsReportedAsEnrolled() {
        assertEquals("Enrolled", enrollmentMessage(null))
    }

    @Test
    fun aWrongExpiredOrUsedCodeTellsTheUserToGetANewOne() {
        assertEquals(
            "Code invalide, expiré ou déjà utilisé",
            enrollmentMessage(OtpVerifyException.InvalidCode("Invalid OTP")),
        )
    }

    @Test
    fun serverSideFailuresKeepTheirStatus() {
        assertEquals(
            "Demande refusée par le serveur (HTTP 404)",
            enrollmentMessage(OtpVerifyException.Rejected(404, "HTTP 404 Client Error")),
        )
        assertEquals(
            "Erreur du serveur (HTTP 503), réessaie plus tard",
            enrollmentMessage(OtpVerifyException.Server(503, "HTTP 503 Server Error")),
        )
    }

    @Test
    fun anUnreachableServerIsNotBlamedOnTheCode() {
        assertEquals(
            "Serveur injoignable, vérifie la connexion",
            enrollmentMessage(OtpVerifyException.Network(IOException("refused"))),
        )
    }

    @Test
    fun aFailureOfALaterStepKeepsTheGenericMessage() {
        val message = enrollmentMessage(IllegalStateException("signature rejected"))

        assertEquals("Enrollment failed", message)
        assertNotEquals(enrollmentMessage(OtpVerifyException.InvalidCode("x")), message)
    }
}
