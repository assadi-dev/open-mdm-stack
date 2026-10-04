import { apkSchema } from "./dto/schema";
import { ApkInfo, IMDMAgentRepository } from "./entities/repositories";


export class MDMAgentRepository implements IMDMAgentRepository {
    streamApkFile(): Promise<AsyncIterableIterator<Buffer>> {
        throw new Error("Method not implemented.");
    }
    async apkInfo(): Promise<ApkInfo> {
        const info = await apkSchema.parseAsync({
            versionName: "1.0.0",
            versionCode: 1,
            packageName: "com.example.mdm_agent",
            label: "MDM Agent",
            size: 1024
        })
        return info;
    }
    getPath(): string {
        throw new Error("Method not implemented.");
    }
    saveNewVersion(file: any): Promise<void> {
        console.log(file);
        return Promise.resolve();
    }


}

