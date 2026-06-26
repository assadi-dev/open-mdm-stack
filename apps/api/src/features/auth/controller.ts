import { AuthService } from "./services";
import { validateLoginInput, validateRegisterInput } from "./validator";
import { Request, Response } from "express";

export class AuthController {
    authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    register = async (req: Request, res: Response) => {
        try {
            const body = req.body;
            const validateInputs = validateRegisterInput(body);
            const result = await this.authService.register(validateInputs);
            const token = await this.authService.signJWT({ id: result.token });
            return res.status(201).json({
                token,
            });
        } catch (error) {
            throw error;
        }
    }

    login = async (req: Request, res: Response) => {
        try {
            const body = req.body;
            const validateInputs = validateLoginInput(body);
            const result = await this.authService.login(validateInputs);
            const token = await this.authService.signJWT({ id: result.token });
            res.json({
                token,
            });
        } catch (error) {
            throw error;
        }
    }

    logout = async (_req: Request, res: Response) => {
        try {
            const jwtToken = _req.headers.authorization?.split(" ")[1].trim();
            await this.authService.logout(jwtToken);
            res.json({
                message: "User logged out successfully",
            });
        } catch (error) {
            throw error;
        }
    }

}