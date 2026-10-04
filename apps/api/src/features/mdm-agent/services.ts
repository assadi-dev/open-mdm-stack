import { MDMAgentRepository } from "./repository";


export class MDMAgentService {
    agentRepo: MDMAgentRepository
    constructor() {
        this.agentRepo = new MDMAgentRepository();
    }


    streamApkFile() {
        return this.agentRepo.streamApkFile();
    }
    apkInfo() {
        return this.agentRepo.apkInfo();
    }
    getPath() {
        return this.agentRepo.getPath();
    }
    async saveNewVersion(file: any) {
        await this.agentRepo.saveNewVersion(file);
        const info = await this.agentRepo.apkInfo()
        return info;
    }
}



