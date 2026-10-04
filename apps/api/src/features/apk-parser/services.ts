import { IApkParserRepository } from "./entities/repositories";
import { ApkParserRepository } from "./repository";
import { IApkParserService } from "./entities/services";


export class ApkParserService implements IApkParserService {

    apkRepo: IApkParserRepository;
    constructor() {
        this.apkRepo = new ApkParserRepository();
    }

    async apkInfo(filePath: any): Promise<any> {
        return await this.apkRepo.parseApkFile(filePath);
    }


}