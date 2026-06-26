import { auth } from "@lib/auth";
import { LoginInput, RegisterInput } from "./dto/schema";
import { AuthResponse } from "./type";

export class AuthService {
    async register(inputs: RegisterInput): Promise<AuthResponse> {



        const response = await auth.api.signUpEmail({
            body: {
                email: inputs.email,
                password: inputs.password,
                name: inputs.name,
            }
        })
        return response;
    }

    async login(inputs: LoginInput) {
        const response = await auth.api.signInEmail({
            body: {
                email: inputs.email,
                password: inputs.password,
            }
        })
        return response;
    }

    async logout(): Promise<void> {
        await auth.api.signOut();
    }
}