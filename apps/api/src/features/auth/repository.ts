import { HTTPNotFoundException } from "@core/exception";
import { db } from "@drizzle/instance";
import { session, user } from "@drizzle/schemas/auth-schema";
import { eq } from "drizzle-orm";


export class AuthRepository {
    async getUserSession(token: string) {
        try {
            const [userSession] = await db.select(
                {
                    token: session.token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        emailVerified: user.emailVerified,
                        image: user.image,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                    }
                }
            ).from(session).leftJoin(user, eq(session.userId, user.id)).where(eq(session.token, token)).limit(1);
            return userSession;
        } catch (error) {
            throw error;
        }
    }

    async revokeSession(token: string) {
        try {
            await db.delete(session).where(eq(session.token, token));
        } catch (error) {
            throw error;
        }
    }

    async revokeUserSession(userId: string) {
        try {
            await db.delete(session).where(eq(session.userId, userId));
        } catch (error) {
            throw error;
        }
    }
}