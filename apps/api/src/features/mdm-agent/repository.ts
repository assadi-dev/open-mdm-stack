import path from "path";
import { apkSchema } from "./dto/schema";
import { ApkInfo, IMDMAgentRepository } from "./entities/repositories";
import fs, { ReadStream } from "fs";
import { IApkParserService } from "@features/apk-parser/entities/services";
import { ApkParserService } from "@features/apk-parser/services";


export class MDMAgentRepository implements IMDMAgentRepository {


    apkService: IApkParserService;
    constructor() {
        this.apkService = new ApkParserService();
    }
    streamApkFile(): ReadStream {
        const filepath = this.getPath();
        const stream = fs.createReadStream(filepath);
        return stream;
    }
    async apkInfo(): Promise<ApkInfo> {
        const extracted = await this.apkService.apkInfo(this.getPath());
        const fileSize = fs.statSync(this.getPath()).size;
        const info = await apkSchema.parseAsync({
            name: extracted.appName,
            versionName: extracted.versionName,
            versionCode: extracted.versionCode,
            packageName: extracted.packageName,
            size: fileSize
        })
        return info;
    }
    getPath(): string {
        const filePath = path.join(process.cwd(), "src", "storage", "mdm-agent", "mdm-agent-latest.apk");
        if (!fs.existsSync(filePath)) {
            throw new Error("MDM Agent APK not found");
        }
        return filePath;
    }
    saveNewVersion(file: any): Promise<void> {
        console.log(file);
        return Promise.resolve();
    }


}

