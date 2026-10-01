import { Router } from "express";
import { requireAuth } from "@middleware/authMiddleware";
import { WifiNetworkController } from "./controller";

// Mounted at /wifi-networks (see app.ts).
const wifiNetworkRouter = Router();
const controller = new WifiNetworkController();

wifiNetworkRouter.post("/", requireAuth, controller.create);
wifiNetworkRouter.get("/", requireAuth, controller.collections);
wifiNetworkRouter.query("/", requireAuth, controller.collections);
wifiNetworkRouter.get("/lists", requireAuth, controller.list);
wifiNetworkRouter.get("/:id", requireAuth, controller.getById);
wifiNetworkRouter.patch("/:id", requireAuth, controller.update);
wifiNetworkRouter.delete("/:id", requireAuth, controller.remove);

export default wifiNetworkRouter;
