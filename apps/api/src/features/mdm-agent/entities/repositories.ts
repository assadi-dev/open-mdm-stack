import { ReadStream } from "fs";





export type ApkInfo = {
    versionName: string,
    versionCode: number,
    packageName: string,
    name: string,
    size: number
}


export interface IMDMAgentRepository {

    streamApkFile(): ReadStream;
    apkInfo(): Promise<ApkInfo>;
    getPath(): string;
    saveNewVersion(file: any): Promise<void>;

}