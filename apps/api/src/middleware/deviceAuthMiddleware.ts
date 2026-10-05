import { NextFunction, Request, Response } from "express";
import { auth } from "@lib/auth";
import { DeviceRepository } from "@features/device/repository";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            deviceId?: string;
        }
    }
}

export const DEVICE_BLOCKED_CODE = "DEVICE_BLOCKED";

/**
 * Authenticates a device by its long-lived device JWT (deviceToken). Validates
 * the token, enforces the `type: "device"` claim, checks the device still
 * exists, is enrolled and isn't blocked (403 `DEVICE_BLOCKED`), and (when present)
 * that the path :deviceId matches the token subject so a device cannot act for another.
 */
export const requireDeviceAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { payload } = await auth.api.verifyJWT({ body: { token } });
        if (!payload || payload.type !== "device" || !payload.sub) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const deviceId = payload.sub as string;
        if (req.params.deviceId && req.params.deviceId !== deviceId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const device = await new DeviceRepository().findDeviceById(deviceId);
        if (!device || device.enrollmentStatus !== "enrolled") {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // The token is still valid, but an admin blocked the device: a stable `code` lets the client tell it
        // apart from any other 403.
        if (device.blockedAt) {
            return res.status(403).json({ message: "Device is blocked", code: DEVICE_BLOCKED_CODE });
        }

        req.deviceId = deviceId;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};
