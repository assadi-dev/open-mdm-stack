import { createChallengeSchema, createProvisioningPayloadSchema, verifyOtpSchema } from "./schema";


export const enrollmentValidator = {

    storeEnrollment: () => { },
    getEnrollmentToken: (input: unknown) => {
        return createChallengeSchema.safeParse(input)
    },
    displayEnrollmentProvisioning: (input: unknown) => {
        return createProvisioningPayloadSchema.safeParse(input)
    },
    verifyOtp: (input: unknown) => {
        return verifyOtpSchema.safeParse(input)
    },
}