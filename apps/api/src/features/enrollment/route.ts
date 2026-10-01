import { EnrollmentController } from "./controller";
import { Router } from "express";

const enrollmentRouter = Router();
const controller = new EnrollmentController();



//enroll (public) then authenticated check-ins

enrollmentRouter.post("/store", controller.store);
enrollmentRouter.get("/challenge", controller.challenge);
enrollmentRouter.post("/display-provisioning", controller.displayEnrollmentProvisioning);
enrollmentRouter.get("/otp-generate", controller.otpGenerate);
enrollmentRouter.post("/otp-verify", controller.otpVerify);

export default enrollmentRouter;
