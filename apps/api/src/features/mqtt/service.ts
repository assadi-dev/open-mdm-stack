import { timingSafeEqual } from "crypto";
import { auth } from "@lib/auth";
import { ENV } from "@config/env";
import { DeviceRepository } from "@features/device/repository";
import { MqttAuthInput } from "./dto/schema";

export type MqttAuthResult =
    | { result: "allow"; is_superuser: boolean }
    | { result: "deny" };

const DENY: MqttAuthResult = { result: "deny" };

const safeEqual = (a: string, b: string) => {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
};

export class MqttService {
    private deviceRepository: DeviceRepository;

    constructor() {
        this.deviceRepository = new DeviceRepository();
    }

    /**
     * Decides an EMQX CONNECT:
     *  - backend: username/password match MQTT_BACKEND_* -> superuser;
     *  - device: password is its device JWT, clientid must equal the JWT
     *    subject (this binding is what makes the ${clientid} ACL safe), and
     *    the device must still be enrolled (so revocation cuts MQTT too).
     */
    async authenticate(input: MqttAuthInput): Promise<MqttAuthResult> {
        if (input.username === ENV.MQTT_BACKEND_USERNAME) {
            return safeEqual(input.password, ENV.MQTT_BACKEND_PASSWORD)
                ? { result: "allow", is_superuser: true }
                : DENY;
        }

        if (!input.password) return DENY;

        try {
            const { payload } = await auth.api.verifyJWT({ body: { token: input.password } });
            if (!payload || payload.type !== "device" || !payload.sub) return DENY;
            if (payload.sub !== input.clientid) return DENY;

            const device = await this.deviceRepository.findDeviceById(payload.sub as string);
            if (!device || device.enrollmentStatus !== "enrolled") return DENY;

            return { result: "allow", is_superuser: false };
        } catch {
            return DENY;
        }
    }
}
