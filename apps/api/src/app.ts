import express from "express";
import { ZodError } from "zod";
import morgan from "morgan";
import cors from "cors";
import { ENV } from "@config/env";
import { registerDependencies } from "./injection/di";
import http from "http";
import { API_BASE_URL, API_VERSION, corsOptions } from "@config/cors";
import { errorHandler } from "./lib/global";
import qrcodeRouter from "@features/qrcode/router";


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = ENV.PORT;

app.use(morgan("dev"));
app.use(cors(corsOptions));

app.use(errorHandler);



app.use(`${API_BASE_URL}/qrcode`, qrcodeRouter);

export const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Version: ${API_VERSION}`);


});

server.on("error", (e) => {
  console.error("Error occurred while starting the server", e);
});

registerDependencies(server);

