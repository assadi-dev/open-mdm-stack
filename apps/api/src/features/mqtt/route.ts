import { Router } from "express";
import { MqttController } from "./controller";

const mqttRouter = Router();
const controller = new MqttController();

// Public on purpose: it only answers "are these credentials valid", which is
// no more than attempting an MQTT CONNECT reveals.
mqttRouter.post("/auth", controller.authenticate);

export default mqttRouter;
