import { EnrollementController } from "./controller";
import { Router } from "express";

const enrollementRouter = Router();
const controller = new EnrollementController();



//enroll (public) then authenticated check-ins

enrollementRouter.post("/store", controller.store);
enrollementRouter.post("/token", controller.getEnrollmentToken);
enrollementRouter.post("/provisioning", controller.displayEnrollmentProvisioning);

export default enrollementRouter;
