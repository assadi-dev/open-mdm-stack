import express from "express";
import morgan from "morgan";
import cors from "cors";
import http from "http";
import { API_BASE_URL, corsOptions } from "@config/cors";
import { errorHandler } from "./lib/global";
import qrcodeRouter from "@features/qrcode/router";
import { auth } from "@lib/auth";
import { toNodeHandler } from "better-auth/node";
import authRouter from "@features/auth/route";
import deviceRouter from "@features/device/route";
import enrollmentRouter from "@features/enrollment/route";
import commandRouter from "@features/command/route";
import mqttRouter from "@features/mqtt/route";


export const app = express();
//app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(cors(corsOptions));



// Static files
app.use(`/downloads/agent`, express.static("src/downloads/apk"));

app.use(`${API_BASE_URL}`, authRouter);
app.use(`${API_BASE_URL}/qrcode`, qrcodeRouter);
app.use(`${API_BASE_URL}/devices/:deviceId/commands`, commandRouter);
app.use(`${API_BASE_URL}/devices`, deviceRouter);
app.use(`${API_BASE_URL}/enrollment`, enrollmentRouter);
app.use(`${API_BASE_URL}/mqtt`, mqttRouter);
app.use(errorHandler);

// http.Server wrapping `app`; listening is started from main.ts so this
// module can be imported (e.g. by supertest) without binding a real port.
export const server = http.createServer(app);

