import { Request, Response } from "express";
import { EnrollmentService } from "./service";
import { enrollmentValidator } from "./dto/validation";
import { HTTPBadRequestException } from "@core/exception";
import { ENV } from "@config/env";




export class EnrollmentController {
    private enrollmentService: EnrollmentService

    constructor() {
        this.enrollmentService = new EnrollmentService();
    }



    displayEnrollmentProvisioning = async (req: Request, res: Response) => {
        const format = req.query?.format as any;
        const ttlSeconds = Number(req.query?.ttlSeconds ?? ENV.ENROLLMENT_CHALLENGE_TTL_SECONDS);
        const body = req.body as any

        const result = await this.enrollmentService.displayProvisioning({ format, ttlSeconds, body });
        if (format === "svg") {
            res.appendHeader("Content-Type", "image/svg+xml");
            return res.send(result)
        }
        res.json(result)
    };

    challenge = async (req: Request, res: Response) => {
        const result = await this.enrollmentService.generateChallenge();
        return res.json(result);
    };



    otpGenerate = async (req: Request, res: Response) => {
        const otp = await this.enrollmentService.generateOTP();
        return res.json(otp);
    }

    otpVerify = async (req: Request, res: Response) => {
        const { code } = req.body as { code: string }
        const ttlSeconds = Number(ENV.ENROLLMENT_CHALLENGE_TTL_SECONDS);

        const result = await this.enrollmentService.verifyOTP({
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
