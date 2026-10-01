import { Router } from "express";
import { requireAuth } from "@middleware/authMiddleware";
import { CommandController } from "./controller";

// Mounted at /devices/:deviceId/commands (see app.ts).
const commandRouter = Router({ mergeParams: true });
const controller = new CommandController();

commandRouter.post("/", requireAuth, controller.create);
commandRouter.get("/", requireAuth, controller.list);

export default commandRouter;
