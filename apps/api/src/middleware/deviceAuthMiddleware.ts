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

/**
 * Authenticates a device by its long-lived device JWT (deviceToken). Validates
 * the token, enforces the `type: "device"` claim, checks the device still
 * exists and is enrolled, and (when present) that the path :deviceId matches the
 * token subject so a device cannot act for another.
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
        if (!device || device.status !== "enrolled") {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.deviceId = deviceId;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};
