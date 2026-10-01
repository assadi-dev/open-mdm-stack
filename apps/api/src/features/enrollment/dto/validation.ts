import { createChallengeSchema, createProvisioningPayloadSchema } from "./schema";


export const enrollmentValidator = {

    storeEnrollment: () => { },
    getEnrollmentToken: (input: unknown) => {
        return createChallengeSchema.safeParse(input)
    },
    displayEnrollmentProvisioning: (input: unknown) => {
        return createProvisioningPayloadSchema.safeParse(input)
    },
}