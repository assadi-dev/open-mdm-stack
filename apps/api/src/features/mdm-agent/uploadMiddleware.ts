import multer from "multer";
import path from "path";
import fs from "fs";
import { HTTPBadRequestException } from "@core/exception";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "src/storage/mdm-agent");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });

        }
        cb(null, uploadDir);
    },
    filename(req, file, callback) {
        const filename = "mdm-agent-latest.apk"
        const ext = path.extname(file.originalname);
        const size = file.size;
        if (size > 10 * 1024 * 1024) {
            throw new HTTPBadRequestException('File size is too large');
        }
        if (ext !== '.apk') {
            throw new HTTPBadRequestException('Invalid file type');
        }
        if (fs.existsSync(path.join(process.cwd(), "src/storage/mdm-agent", filename))) {
            fs.unlinkSync(path.join(process.cwd(), "src/storage/mdm-agent", filename));
        }
        callback(null, filename);
    },

})

const upload = multer({ storage });

export const mdmAgentUploadMiddleware = upload.single("file");
