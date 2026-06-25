import { Router } from "express";
import { QRCodeController } from "./controller";


const qrcodeRouter = Router();

const controller = new QRCodeController();

qrcodeRouter.post("/generate", controller.generateQRController);

export default qrcodeRouter;