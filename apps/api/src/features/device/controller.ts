import { Request, Response } from "express";
import path from "path";
import { API_BASE_URL } from "@config/cors";
import { HTTPNotFoundException } from "@core/exception";
import { DeviceService } from "./service";
import {
    validateEnrollDeviceInput,
    validateInventoryInput,
} from "./validator";

export class DeviceController {
    private deviceService: DeviceService;

    constructor() {
        this.deviceService = new DeviceService();
    }

    // GET /devices/enroll/challenge  (public — anti-replay nonce for the pinned-key handshake)
    challenge = async (req: Request, res: Response) => {
        const result = await this.deviceService.issueChallenge();
        return res.json(result);
    };

    // POST /devices/enroll  (public — gated by a single-use enrollment token)
    enroll = async (req: Request, res: Response) => {
        const input = validateEnrollDeviceInput(req.body);
        const result = await this.deviceService.create(input);
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
