import { Router } from "express";
import { DeviceController } from "./controller";
import { requireAuth } from "@middleware/authMiddleware";
import { requireDeviceAuth } from "@middleware/deviceAuthMiddleware";


const deviceRouter = Router();
const controller = new DeviceController();





// Admin (dashboard). `/summary` is declared before any `/:deviceId` route.
deviceRouter.get("/", requireAuth, controller.collections);
deviceRouter.get("/summary", requireAuth, controller.summary);
deviceRouter.patch("/:id", requireAuth, controller.update);
deviceRouter.delete("/", requireAuth, controller.removeMany);
deviceRouter.post("/refresh", requireAuth, controller.refreshMany);
deviceRouter.post("/:id/refresh", requireAuth, controller.refresh);
deviceRouter.post("/block", requireAuth, controller.blockMany);
deviceRouter.post("/:id/block", requireAuth, controller.block);

deviceRouter.post("/enroll", controller.enroll);
deviceRouter.post("/:deviceId/heartbeat", requireDeviceAuth, controller.heartbeat);
deviceRouter.post("/:deviceId/inventory", requireDeviceAuth, controller.inventory);
deviceRouter.patch("/:deviceId/telemetry", requireDeviceAuth, controller.patchTelemetry);

export default deviceRouter;
