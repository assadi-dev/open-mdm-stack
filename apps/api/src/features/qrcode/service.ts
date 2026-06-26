import QRCode from 'qrcode'
import path from 'path'
import fs from 'fs'



export const generateQR = async (text: string) => {
    try {
        const qrcodeDir = path.join(process.cwd(), "storage/qrcodes");
        if (!fs.existsSync(qrcodeDir)) {
            fs.mkdirSync(qrcodeDir, { recursive: true });
        }
        const fileName = `qrcode-${Date.now()}.png`;
        await QRCode.toFile(path.join(qrcodeDir, fileName), text, { errorCorrectionLevel: "M" })
        return fileName;
    } catch (err) {
        console.error(err)
    }
};