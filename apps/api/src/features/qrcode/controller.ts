import { generateQR } from "./service";
import { Request, Response } from "express";


export class QRCodeController {

    async generateQRController(req: Request, res: Response) {
        try {
            const { text } = req.body;
            const qrCode = await generateQR(text);
            return res.json({
                message: "QR code generated successfully",
                data: qrCode
            });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}