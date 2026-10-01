import "dotenv/config";

// Enable decorators
import "reflect-metadata";

import { ENV } from "./core/config/env";
import { API_VERSION } from "@config/cors";

import { registerDependencies } from "./injection/di";
import { server } from "./app";
import { mqttGateway } from "@lib/mqtt";
import { CommandService } from "@features/command/service";

const PORT = ENV.PORT;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Version: ${API_VERSION}`);
});

server.on("error", (e) => {
  console.error("Error occurred while starting the server", e);
});

registerDependencies(server);

// Started here (not in app.ts) so tests importing the app never open a broker connection.
const commandService = new CommandService();
mqttGateway.onDeviceMessage((deviceId, kind, payload) =>
  commandService.handleDeviceMessage(deviceId, kind, payload),
);
mqttGateway.onConnect(() => commandService.flushPendingForOnlineDevices());
mqttGateway.start();
