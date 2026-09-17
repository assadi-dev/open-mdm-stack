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

        const format = req.query?.format;
        const ttlSeconds = Number(req.query?.ttlSeconds) ?? Number(ENV.ENROLLMENT_TOKEN_TTL_SECONDS);

        const token = await this.enrollementService.generateToken({ ttlSeconds });
        const input = enrollementValidator.displayEnrollmentProvisioning({
            ...req.body,
            token
        })
        if (!input.success) {
            throw input.error
        }

        if (format === "svg") {
            const svg = await this.enrollementService.generatePayloadProvisioningToSVG(input.data);
            res.appendHeader("Content-Type", "image/svg+xml");
            return res.send(svg);

        }

        const json = await this.enrollementService.generateProvisioningPayload(input.data);
        return res.json(json);

    };


    getEnrollmentToken = async (req: Request, res: Response) => {
        const input = enrollementValidator.getEnrollmentToken(req.body)
        if (!input.success) {
            throw input.error
        }
        const token = await this.enrollementService.generateToken(input.data);
        return res.json(token);

    };

    store = async (req: Request, res: Response) => {

    };

    updateToken = async (req: Request, res: Response) => {

    };

    delete = async (req: Request, res: Response) => {

    };
}
