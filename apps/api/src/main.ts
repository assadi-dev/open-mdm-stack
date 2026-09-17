import "dotenv/config";

// Enable decorators
import "reflect-metadata";

import { ENV } from "./core/config/env";
import { API_VERSION } from "@config/cors";

import { registerDependencies } from "./injection/di";
import { server } from "./app";

const PORT = ENV.PORT;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Version: ${API_VERSION}`);
});

server.on("error", (e) => {
  console.error("Error occurred while starting the server", e);
});

registerDependencies(server);
