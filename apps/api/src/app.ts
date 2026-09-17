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
import enrollementRouter from "@features/enrollement/route";


export const app = express();
//app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(cors(corsOptions));



// Static files
app.use(`/download/agent`, express.static("src/download/apk"));

app.use(`${API_BASE_URL}`, authRouter);
app.use(`${API_BASE_URL}/qrcode`, qrcodeRouter);
app.use(`${API_BASE_URL}/devices`, deviceRouter);
app.use(`${API_BASE_URL}/enrollement`, enrollementRouter);
app.use(errorHandler);

// http.Server wrapping `app`; listening is started from main.ts so this
// module can be imported (e.g. by supertest) without binding a real port.
export const server = http.createServer(app);

