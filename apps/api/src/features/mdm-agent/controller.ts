import { Request, Response } from "express";
import { MDMAgentService } from "./services";


export class MDMAgentController {

    private agentService: MDMAgentService;
    constructor() {
        this.agentService = new MDMAgentService();
    }

    downloadApk = async (req: Request, res: Response) => {
        const info = await this.agentService.apkInfo();
        const stream = this.agentService.streamApkFile();
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', `attachment; filename=agent-${Date.now()}.apk`);
        res.setHeader('Content-Length', info.size);
        for await (const chunk of stream) {
            res.write(chunk);
        }
        res.end();
    }


    apkInfo = async (req: Request, res: Response) => {
        const info = await this.agentService.apkInfo();
        return res.json(info);
    }

    uploadApk = async (req: Request, res: Response) => {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const info = await this.agentService.saveNewVersion(file);

        return res.json(info);
    }




}