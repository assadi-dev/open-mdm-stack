import { NextFunction, Request, Response } from "express";
import { AuthService } from "@features/auth/services";
import { HTTPNotFoundException } from "@core/exception";

export const isAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authService = new AuthService();
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            throw new HTTPNotFoundException("headers token is required");
        }
        const payload = await authService.extractPayload(token);
        const tokenSession = payload.sub;
        const session = await authService.getSession(tokenSession);

        if (!session) {
            throw new HTTPNotFoundException("no session found");
        }
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}