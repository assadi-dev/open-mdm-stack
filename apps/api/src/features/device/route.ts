import { Router } from "express";
import { DeviceController } from "./controller";
import { requireAuth } from "@middleware/authMiddleware";
import { requireDeviceAuth } from "@middleware/deviceAuthMiddleware";


const deviceRouter = Router();
const controller = new DeviceController();





deviceRouter.post("/enroll", controller.enroll);
deviceRouter.post("/:deviceId/heartbeat", requireDeviceAuth, controller.heartbeat);
deviceRouter.post("/:deviceId/inventory", requireDeviceAuth, controller.inventory);

export default deviceRouter;
