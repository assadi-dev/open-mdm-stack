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
import { auth } from "@lib/auth";
import { toNodeHandler } from "better-auth/node";
import authRouter from "@features/auth/route";
import deviceRouter from "@features/device/route";



const PORT = ENV.PORT;
const app = express();
//app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));



app.use(cors(corsOptions));



// Static files
app.use(`/download/apk`, express.static("src/download/apk"));

app.use(`${API_BASE_URL}`, authRouter);
app.use(`${API_BASE_URL}/qrcode`, qrcodeRouter);
app.use(`${API_BASE_URL}/devices`, deviceRouter);
app.use(errorHandler);

export const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Version: ${API_VERSION}`);


});

server.on("error", (e) => {
  console.error("Error occurred while starting the server", e);
});

registerDependencies(server);

