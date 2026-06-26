

import { Router } from "express";
import { AuthController } from "./controller";


const authRouter = Router();

const controller = new AuthController();

authRouter.post("/register", controller.register);
authRouter.post("/login", controller.login);
authRouter.get("/logout", controller.logout);

export default authRouter;