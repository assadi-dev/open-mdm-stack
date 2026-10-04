import { IApkParsedData } from "./repositories";



export interface IApkParserService {
    apkInfo(file: any): Promise<IApkParsedData>;

}