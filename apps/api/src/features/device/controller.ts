import { Request, Response } from "express";
import path from "path";
import { API_BASE_URL } from "@config/cors";
import { HTTPNotFoundException } from "@core/exception";
import { DeviceService } from "./service";
import {
    validateEnrollDeviceInput,
    validateHeartbeatInput,
    validateInventoryInput,
} from "./validator";

export class DeviceController {
    private deviceService: DeviceService;

    constructor() {
        this.deviceService = new DeviceService();
    }



    // POST /devices/enroll  (public — gated by a single-use challenge from GET /api/v1/enrollment/challenge)
    enroll = async (req: Request, res: Response) => {
        const input = validateEnrollDeviceInput(req.body);
        const result = await this.deviceService.create(input);
        return res.status(201).json(result);
    };

    // POST /devices/:deviceId/heartbeat  (device JWT)
    heartbeat = async (req: Request, res: Response) => {
        const input = validateHeartbeatInput(req.body);
        await this.deviceService.recordHeartbeat(req.deviceId as string, input);
        return res.json({ ok: true });
    };

    // POST /devices/:deviceId/inventory  (device JWT)
    inventory = async (req: Request, res: Response) => {
        const input = validateInventoryInput(req.body);
        await this.deviceService.recordInventory(req.deviceId as string, input);
        return res.json({ ok: true });
    };
}
