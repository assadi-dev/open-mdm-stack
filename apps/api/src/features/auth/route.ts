

import { Router } from "express";
import { AuthController } from "./controller";
import { requireAuth } from "@middleware/authMiddleware";


const authRouter = Router();

const controller = new AuthController();

authRouter.post("/register", controller.register);
authRouter.post("/email", controller.login);
authRouter.post("/:provider", controller.authProvider);
authRouter.get("/logout", requireAuth, controller.logout);

export default authRouter;