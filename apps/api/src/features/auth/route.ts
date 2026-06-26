

import { Router } from "express";
import { AuthController } from "./controller";
import { requireAuth } from "@features/middleware/authMiddleware";


const authRouter = Router();

const controller = new AuthController();

authRouter.post("/register", controller.register);
authRouter.post("/login", controller.login);
authRouter.get("/logout", requireAuth, controller.logout);

export default authRouter;