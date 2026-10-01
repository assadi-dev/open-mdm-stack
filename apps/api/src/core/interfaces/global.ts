import { IncomingMessage, ServerResponse, Server } from "http";

export type ExpressServer = Server<
  typeof IncomingMessage,
  typeof ServerResponse
>;
