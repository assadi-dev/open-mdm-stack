



export interface IApkParsedData {
    appName: string;
    packageName: string;
    versionCode: number;
    versionName: string;
    size: number;
    iconBlob: any;
    signatures: any[]
}

export interface IApkParserRepository {
    parseApkFile(file: any): Promise<IApkParsedData>;
    getIcon(apkPath: string): Promise<any>;



}