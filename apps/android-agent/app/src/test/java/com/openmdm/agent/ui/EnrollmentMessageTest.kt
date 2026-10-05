package com.openmdm.agent.ui

import com.openmdm.agent.data.repository.OtpVerifyException
import java.io.IOException
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response

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

    private fun httpError(status: Int) = HttpException(Response.error<Any>(status, "".toResponseBody()))

    @Test
    fun theEnrollmentWithoutACodeReportsTheNetworkAndHttpErrorsAsTheyAre() {
        assertEquals("Serveur injoignable, vérifie la connexion", enrollmentMessage(IOException("no route")))
        assertEquals("Demande refusée par le serveur (HTTP 400)", enrollmentMessage(httpError(400)))
        assertEquals("Erreur du serveur (HTTP 503), réessaie plus tard", enrollmentMessage(httpError(503)))
    }

    @Test
    fun theToastOfAFailedAutomaticEnrollmentGivesTheReasonWhenItIsKnown() {
        assertEquals(
            "Échec de l'enrôlement automatique : Serveur injoignable, vérifie la connexion",
            autoEnrollmentFailureMessage(IOException("no route")),
        )
        assertEquals(
            "Échec de l'enrôlement automatique : Demande refusée par le serveur (HTTP 400)",
            autoEnrollmentFailureMessage(httpError(400)),
        )
    }

    @Test
    fun theToastOfAnUnknownFailureIsNotMixedWithTheGenericEnglishMessage() {
        assertEquals(
            "Échec de l'enrôlement automatique",
            autoEnrollmentFailureMessage(IllegalStateException("signature rejected")),
        )
    }
}
