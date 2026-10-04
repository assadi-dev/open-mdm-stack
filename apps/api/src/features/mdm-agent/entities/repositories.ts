




export type ApkInfo = {
    versionName: string,
    versionCode: number,
    packageName: string,
    label: string,
    size: number
}


export interface IMDMAgentRepository {

    streamApkFile(): Promise<AsyncIterableIterator<Buffer>>;
    apkInfo(): Promise<ApkInfo>;
    getPath(): string;
    saveNewVersion(file: any): Promise<void>;

}