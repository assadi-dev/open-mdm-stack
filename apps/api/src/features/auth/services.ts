import { auth } from "@lib/auth";
import { LoginInput, RegisterInput } from "./dto/schema";
import { AuthResponse } from "./type";
import { JWTPayload } from "better-auth";
import { ENV } from "@config/env";
import { AuthRepository } from "./repository";
import { HTTPNotFoundException } from "@core/exception";

export class AuthService {
    authRepository: AuthRepository;
    constructor() {
        this.authRepository = new AuthRepository();
    }
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

    async logout(jwtToken: string): Promise<void> {
        const userSession = await this.getUserSessionFromJWT(jwtToken);
        if (!userSession) {
            throw new HTTPNotFoundException("Session not found");
        }
        await this.authRepository.revokeUserSession(userSession.user.id);
    }

    async verifyToken(token: string): Promise<boolean> {
        try {
            await auth.api.verifyJWT({
                body: {
                    token,
                }
            })
            return true
        } catch (error) {
            return false
        }
    }

    async extractPayload(token: string): Promise<JWTPayload> {
        try {
            const { payload } = await auth.api.verifyJWT({
                body: {
                    token,
                }
            })
            return payload;
        } catch (error) {
            throw error;
        }
    }

    async signJWT({ id }: { id: string }) {

        const payload: JWTPayload & Required<Pick<JWTPayload, "sub" | "aud">> = {
            sub: id,
            aud: ENV.BETTER_AUTH_URL,
            iss: ENV.BETTER_AUTH_URL,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
            iat: Math.floor(Date.now() / 1000),
        }
        const { token } = await auth.api.signJWT({
            body: {
                payload,
            }
        })


        return token;
    }

    async getSession(token: string) {
        try {
            const session = await this.authRepository.getUserSession(token);
            return session;
        } catch (error) {
            throw error;
        }
    }


    async getUserSessionFromJWT(jwtToken: string) {
        try {
            const extractPayload = await this.extractPayload(jwtToken);
            const session = await this.getSession(extractPayload.sub);
            return session;

        } catch (error) {
            throw error;
        }
    }

}