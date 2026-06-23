import { Server } from "http";
import { container } from "tsyringe";
import { TOKENS } from "./tokens";
import { LiveKitService } from "../features/livekit/LiveKitService";

export const registerDependencies = (server: Server) => {
    container.register(TOKENS.liveKitService, { useClass: LiveKitService });
};
