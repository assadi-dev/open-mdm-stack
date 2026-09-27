import { authDecoder, LoginInput, RegisterInput, SocialProvider } from "./dto/schema";


export const validateRegisterInput = (body: unknown): RegisterInput => {
    const result = authDecoder.register(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
}

export const validateLoginInput = (body: unknown): LoginInput => {
    const result = authDecoder.login(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
}


export const validateSocialProvider = (provider: unknown): SocialProvider => {
    const result = authDecoder.socialProvider(provider);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
}