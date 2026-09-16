import { createEnrollmentTokenSchema, createTokenSchema } from "./schema";


export const enrollementValidator = {

    storeEnrollment: () => { },
    getEnrollmentToken: (input: unknown) => {
        return createTokenSchema.safeParse(input)
    },
    displayEnrollmentProvisioning: (input: unknown) => {
        return createEnrollmentTokenSchema.safeParse(input)
    },
}