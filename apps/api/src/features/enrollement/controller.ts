import { Request, Response } from "express";
import { EnrollementService } from "./service";
import { enrollementValidator } from "./dto/validation";
import { HTTPBadRequestException } from "@core/exception";
import { ENV } from "@config/env";




export class EnrollementController {
    private enrollementService: EnrollementService

    constructor() {
        this.enrollementService = new EnrollementService();
    }



    displayEnrollmentProvisioning = async (req: Request, res: Response) => {
        const format = req.query?.format as any;
        const ttlSeconds = Number(req.query?.ttlSeconds ?? ENV.ENROLLMENT_TOKEN_TTL_SECONDS);
        const body = req.body as any

        const result = await this.enrollementService.displayProvisioning({ format, ttlSeconds, body });
        if (format === "svg") {
            res.appendHeader("Content-Type", "image/svg+xml");
            return res.send(result)
        }
        res.json(result)
    };


    getEnrollmentToken = async (req: Request, res: Response) => {
        const input = enrollementValidator.getEnrollmentToken(req.body)
        if (!input.success) {
            throw input.error
        }
        const token = await this.enrollementService.generateToken(input.data);
        return res.json(token);

    };

    otpGenerate = async (req: Request, res: Response) => {
        const otp = await this.enrollementService.generateOTP();
        return res.json(otp);
    }

    otpVerify = async (req: Request, res: Response) => {
        const { code } = req.body as { code: string }
        const ttlSeconds = Number(ENV.ENROLLMENT_TOKEN_TTL_SECONDS);

        const result = await this.enrollementService.verifyOTP({
            otp: code,
            ttlSeconds
        });
        return res.json(result);
    }



    store = async (req: Request, res: Response) => {

    };

    updateToken = async (req: Request, res: Response) => {

    };

    delete = async (req: Request, res: Response) => {

    };
}
