import { Request, Response } from "express";
import { MqttService } from "./service";
import { mqttDecoder } from "./dto/schema";

export class MqttController {
    private mqttService: MqttService;

    constructor() {
        this.mqttService = new MqttService();
    }

    // POST /mqtt/auth  (called by EMQX only). Always 200: EMQX reads `result`,
    // and a non-2xx would make it fall through to the next authenticator.
    authenticate = async (req: Request, res: Response) => {
        const input = mqttDecoder.auth(req.body);
        if (!input.success) {
            return res.json({ result: "deny" });
        }
        const result = await this.mqttService.authenticate(input.data);
        return res.json(result);
    };
}
