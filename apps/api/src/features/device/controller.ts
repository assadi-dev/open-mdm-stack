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
