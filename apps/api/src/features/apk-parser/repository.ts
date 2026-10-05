import { openAsBlob } from "node:fs";
import { parseApkFile } from "simple-apk-parser";
import { IApkParserRepository } from "./entities/repositories";


export class ApkParserRepository implements IApkParserRepository {

    // La librairie lit un `Blob`, pas un chemin : `openAsBlob` lit le fichier au fil des besoins, sans le charger en entier.
    private async parse(filePath: string) {
        return await parseApkFile(await openAsBlob(filePath));
    }

    // L'icône en `Buffer` (WebP ou PNG), ou `null` si l'APK n'en a pas.
    async getIcon(filePath: string): Promise<any> {
        const { iconBlob } = await this.parse(filePath);
        return iconBlob ? Buffer.from(await iconBlob.arrayBuffer()) : null;
    }

    async parseApkFile(filePath: string): Promise<any> {
        return await this.parse(filePath);
    }

}
