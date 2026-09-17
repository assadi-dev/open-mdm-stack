import { EnrollementController } from "./controller";
import { Router } from "express";

const enrollementRouter = Router();
const controller = new EnrollementController();



//enroll (public) then authenticated check-ins

enrollementRouter.post("/store", controller.store);
enrollementRouter.get("/token-generate", controller.getEnrollmentToken);
enrollementRouter.post("/display-provisioning", controller.displayEnrollmentProvisioning);
enrollementRouter.get("/otp-generate", controller.otpGenerate);
enrollementRouter.post("/otp-verify", controller.otpVerify);

export default enrollementRouter;
