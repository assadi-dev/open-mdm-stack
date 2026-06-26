

import { Router } from "express";
import { AuthController } from "./controller";
import { isAuth } from "@features/middleware/isAuth";


const authRouter = Router();

const controller = new AuthController();

authRouter.post("/register", controller.register);
authRouter.post("/login", controller.login);
authRouter.get("/logout", isAuth, controller.logout);

export default authRouter;