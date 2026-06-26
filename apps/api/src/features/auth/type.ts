import { User } from "better-auth";

export type AuthResponse = {
    token: string;
    user: User;
}