import { Router } from "express";
import { DeviceController } from "./controller";
import { requireAuth } from "@middleware/authMiddleware";
import { requireDeviceAuth } from "@middleware/deviceAuthMiddleware";

const deviceRouter = Router();
const controller = new DeviceController();

// Admin: enrollment token + QR
deviceRouter.post("/enroll-tokens", requireAuth, controller.createEnrollmentToken);
deviceRouter.get("/enroll-tokens/:id/qr", requireAuth, controller.getEnrollmentTokenQr);

// Device: enroll (public) then authenticated check-ins
deviceRouter.post("/enroll", controller.enroll);
deviceRouter.post("/:deviceId/heartbeat", requireDeviceAuth, controller.heartbeat);
deviceRouter.post("/:deviceId/inventory", requireDeviceAuth, controller.inventory);

export default deviceRouter;
