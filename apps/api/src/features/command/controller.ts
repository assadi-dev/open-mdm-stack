import { Request, Response } from "express";
import { CommandService } from "./service";
import { validateCreateCommandInput, validateDeviceIdParam } from "./validator";

export class CommandController {
    private commandService: CommandService;

    constructor() {
        this.commandService = new CommandService();
    }

    // POST /devices/:deviceId/commands  (admin)
    create = async (req: Request<{ deviceId: string }>, res: Response) => {
        const deviceId = validateDeviceIdParam(req.params.deviceId);
        const input = validateCreateCommandInput(req.body);
        const command = await this.commandService.create(deviceId, input);
        return res.status(201).json(command);
    };

    // GET /devices/:deviceId/commands  (admin)
    list = async (req: Request<{ deviceId: string }>, res: Response) => {
        const deviceId = validateDeviceIdParam(req.params.deviceId);
        const commands = await this.commandService.list(deviceId);
        return res.json(commands);
    };
}
