
import { Router } from "express";
import { MDMAgentController } from "./controller";
import { mdmAgentUploadMiddleware } from "./uploadMiddleware";

const mdmAgentController = new MDMAgentController();

const mdmAgentDownloadRouter = Router();
mdmAgentDownloadRouter.get("/info", mdmAgentController.apkInfo);
mdmAgentDownloadRouter.get("/download", mdmAgentController.downloadApk);
mdmAgentDownloadRouter.post("/upload", mdmAgentUploadMiddleware, mdmAgentController.uploadApk);

export default mdmAgentDownloadRouter;



