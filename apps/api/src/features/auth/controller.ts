import { AuthService } from "./services";
import { validateLoginInput, validateRegisterInput } from "./validator";
import { Request, Response } from "express";

export class AuthController {
    authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    async register(req: Request, res: Response) {
        try {
            const body = req.body;
            const validateInputs = validateRegisterInput(body);
            const result = await this.authService.register(validateInputs);
            return res.status(201).json(result);
        } catch (error) {
            throw error;
        }
    }

    async login(req: Request, res: Response) {
        try {
            const body = req.body;
            const validateInputs = validateLoginInput(body);
            const user = await this.authService.login(validateInputs);
            res.json(user);
        } catch (error) {
            throw error;
        }
    }

    async logout(req: Request, res: Response) {
        try {
            await this.authService.logout();
            res.json({
                message: "User logged out successfully",
            });
        } catch (error) {
            throw error;
        }
    }

}