import { Request, Response } from "express";
import { EnrollementService } from "./service";
import { enrollementValidator } from "./dto/validation";
import { HTTPBadRequestException } from "@core/exception";




export class EnrollementController {
    private enrollementService: EnrollementService

    constructor() {
        this.enrollementService = new EnrollementService();
    }



    displayEnrollmentProvisioning = async (req: Request, res: Response) => {

        const format = req.query?.format;
        if (format === "svg") {
            const svg = await this.enrollementService.generateQrProvisioning(req.body);
            res.appendHeader("Content-Type", "image/svg+xml");
            return res.send(svg);

        }

        const json = await this.enrollementService.buildProvisioningPayload(req.body);
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
