import { Request, Response } from "express";
import path from "path";
import { API_BASE_URL } from "@config/cors";
import { HTTPNotFoundException } from "@core/exception";
import { DeviceService } from "./service";
import {
    validateBlockDevicesInput,
    validateDeleteDevicesInput,
    validateDeviceCollectionQuery,
    validateDeviceIdParam,
    validateEnrollDeviceInput,
    validateHeartbeatInput,
    validateInventoryInput,
    validateRefreshDevicesInput,
    validateTelemetryPatchInput,
    validateUpdateDeviceInput,
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

    // PATCH /devices/:deviceId/telemetry  (device JWT)
    patchTelemetry = async (req: Request, res: Response) => {
        const input = validateTelemetryPatchInput(req.body);
        await this.deviceService.patchTelemetry(req.deviceId as string, input);
        return res.json({ ok: true });
    };

    // GET /devices?page&limit&search&sort&status&sdkVersion  (admin)
    collections = async (req: Request, res: Response) => {
        const query = validateDeviceCollectionQuery(req.query);
        const result = await this.deviceService.collection(query);
        return res.json(result);
    };

    // GET /devices/summary  (admin)
    summary = async (_req: Request, res: Response) => {
        const result = await this.deviceService.summary();
        return res.json(result);
    };

    // PATCH /devices/:id  { name?, androidVersion?, sdkVersion?, androidId? }  (admin)
    update = async (req: Request<{ id: string }>, res: Response) => {
        const id = validateDeviceIdParam(req.params.id);
        const input = validateUpdateDeviceInput(req.body);
        const device = await this.deviceService.update(id, input);
        return res.json(device);
    };

    // DELETE /devices  { ids: [...] }  (admin) — deletes the devices and their data; one id deletes a single device
    removeMany = async (req: Request, res: Response) => {
        const { ids } = validateDeleteDevicesInput(req.body);
        await this.deviceService.remove(ids);
        return res.status(204).send();
    };

    // POST /devices/:id/block  (admin) — answers with the updated list row; 404 unknown device
    block = async (req: Request<{ id: string }>, res: Response) => {
        const id = validateDeviceIdParam(req.params.id);
        const device = await this.deviceService.block(id);
        return res.json(device);
    };

    // POST /devices/block  { ids: [...] }  (admin) — the same for several devices at once; unknown ids are ignored
    blockMany = async (req: Request, res: Response) => {
        const { ids } = validateBlockDevicesInput(req.body);
        await this.deviceService.blockMany(ids);
        return res.status(204).send();
    };

    // POST /devices/:id/refresh  (admin) — asks the device to report now, then answers with its updated list row.
    // 404 unknown device, 409 offline, 502 the device failed, 503 broker down, 504 no answer (see CommandService.refresh)
    refresh = async (req: Request<{ id: string }>, res: Response) => {
        const id = validateDeviceIdParam(req.params.id);
        const device = await this.deviceService.refresh(id);
        return res.json(device);
    };

    // POST /devices/refresh  { ids: [...] }  (admin) — the same for several devices at once: always 200, with one
    // outcome per device
    refreshMany = async (req: Request, res: Response) => {
        const { ids } = validateRefreshDevicesInput(req.body);
        const results = await this.deviceService.refreshMany(ids);
        return res.json({ results });
    };
}
