import { Request, Response } from "express";
import path from "path";
import { API_BASE_URL } from "@config/cors";
import { HTTPNotFoundException } from "@core/exception";
import { DeviceService } from "./service";
import {
    validateCreateEnrollmentTokenInput,
    validateEnrollDeviceInput,
    validateInventoryInput,
} from "./validator";

export class DeviceController {
    private deviceService: DeviceService;

    constructor() {
        this.deviceService = new DeviceService();
    }

    // POST /devices/enroll-tokens  (admin)
    createEnrollmentToken = async (req: Request, res: Response) => {
        const input = validateCreateEnrollmentTokenInput(req.body ?? {});
        const result = await this.deviceService.generateEnrollmentToken(input);
        return res.status(201).json({
            id: result.id,
            token: result.token,
            expiresAt: result.expiresAt,
            qrUrl: `${API_BASE_URL}/devices/enroll-tokens/${result.id}/qr`,
            provisioning: result.provisioning,
        });
    };

    // GET /devices/enroll-tokens/:id/qr  (admin)
    getEnrollmentTokenQr = async (req: Request, res: Response) => {
        const tokenRow = await this.deviceService.getTokenById(req.params.id as string);
        if (!tokenRow.qrFileName) {
            throw new HTTPNotFoundException("QR not generated for this token");
        }
        const filePath = path.join(process.cwd(), "storage/qrcodes", tokenRow.qrFileName);
        return res.sendFile(filePath);
    };

    // POST /devices/enroll  (device, unauthenticated)
    enroll = async (req: Request, res: Response) => {
        const input = validateEnrollDeviceInput(req.body);
        const result = await this.deviceService.enrollDevice(input);
        return res.status(201).json(result);
    };

    // POST /devices/:deviceId/heartbeat  (device JWT)
    heartbeat = async (req: Request, res: Response) => {
        await this.deviceService.recordHeartbeat(req.deviceId as string);
        return res.json({ ok: true });
    };

    // POST /devices/:deviceId/inventory  (device JWT)
    inventory = async (req: Request, res: Response) => {
        const input = validateInventoryInput(req.body);
        await this.deviceService.recordInventory(req.deviceId as string, input);
        return res.json({ ok: true });
    };
}
