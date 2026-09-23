/**
 * Simulates the Android agent's MQTT side against a running dev server and
 * the EMQX broker (dependencies/compose.yml): enrolls a fictional device
 * (same pinned-key flow as mock-device-enroll.ts), then connects to MQTT with
 * its device JWT, announces presence, and executes/acks every command it
 * receives. Doubles as the reference for the agent's MQTT protocol:
 *
 *   CONNECT   clientId = deviceId, username = deviceId, password = deviceToken,
 *             clean = false, will = status {"state":"offline"} (retained, QoS 1)
 *   PUBLISH   mdm/devices/{id}/status  {"state":"online"}          (retained, QoS 1)
 *   SUBSCRIBE mdm/devices/{id}/commands                            (QoS 1)
 *     <- {"id","type","payload","issuedAt","expiresAt"}  (at-least-once: dedupe by id)
 *   PUBLISH   mdm/devices/{id}/acks  {"commandId","status":"acknowledged"}
 *   PUBLISH   mdm/devices/{id}/acks  {"commandId","status":"succeeded"|"failed","result"?,"error"?}
 *
 * Usage:
 *   npx tsx scripts/mock-device-mqtt.ts
 *   MOCK_BASE_URL=http://localhost:5573 MOCK_MQTT_URL=mqtt://localhost:1883 npx tsx scripts/mock-device-mqtt.ts
 *
 * Ctrl+C disconnects gracefully (publishes "offline"); kill -9 lets the
 * broker fire the Last Will instead.
 */

import mqtt from "mqtt";
import { generateCanonicalMessage } from "../src/features/enrollment/utils/canonical-message";
import { generateMockAndroidId, generateMockDeviceKeyPair } from "../src/features/enrollment/utils/mock-device-keys";

const BASE_URL = process.env.MOCK_BASE_URL ?? "http://localhost:5573";
const MQTT_URL = process.env.MOCK_MQTT_URL ?? "mqtt://localhost:1883";

const mockKeyPair = generateMockDeviceKeyPair();

const FICTIONAL_DEVICE = {
    androidId: `${generateMockAndroidId()}`,
    model: "Pixel 8 (mock mqtt)",
    manufacturer: "Google",
    brand: "google",
    release: "14",
    sdkVersion: 34,
    serial: "unknown",
    enrollmentMethod: "manual" as const,
    publicKey: mockKeyPair.publicKey,
};

async function callJson(method: string, path: string, body?: unknown) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`${method} ${path} -> ${res.status} ${res.statusText}\n${text}`);
    }
    return text ? JSON.parse(text) : undefined;
}

async function enroll(): Promise<{ deviceId: string; deviceToken: string }> {
    const { challenge } = await callJson("GET", "/api/v1/enrollment/challenge");
    const timestamp = new Date().toISOString();
    const signature = mockKeyPair.sign(generateCanonicalMessage({
        model: FICTIONAL_DEVICE.model,
        manufacturer: FICTIONAL_DEVICE.manufacturer,
        release: FICTIONAL_DEVICE.release,
        serialNumber: FICTIONAL_DEVICE.serial,
        imei: "",
        macAddress: "",
        androidId: FICTIONAL_DEVICE.androidId,
        method: FICTIONAL_DEVICE.enrollmentMethod,
        timestamp,
        publicKey: mockKeyPair.publicKey,
        challenge,
    }));
    return callJson("POST", "/api/v1/devices/enroll", { challenge, timestamp, signature, device: FICTIONAL_DEVICE });
}

async function main() {
    const { deviceId, deviceToken } = await enroll();
    console.log(`Enrolled mock device ${deviceId}`);

    const topics = {
        status: `mdm/devices/${deviceId}/status`,
        commands: `mdm/devices/${deviceId}/commands`,
        acks: `mdm/devices/${deviceId}/acks`,
    };

    const client = mqtt.connect(MQTT_URL, {
        clientId: deviceId,
        username: deviceId,
        password: deviceToken,
        clean: false,
        keepalive: 30,
        will: {
            topic: topics.status,
            payload: Buffer.from(JSON.stringify({ state: "offline" })),
            qos: 1,
            retain: true,
        },
    });

    const seen = new Set<string>();
    const ack = (body: object) => client.publishAsync(topics.acks, JSON.stringify(body), { qos: 1 });

    client.on("connect", async () => {
        console.log(`MQTT connected to ${MQTT_URL}`);
        await client.subscribeAsync(topics.commands, { qos: 1 });
        await client.publishAsync(topics.status, JSON.stringify({ state: "online" }), { qos: 1, retain: true });
        console.log(`Online. Send a command with:\n  curl -X POST ${BASE_URL}/api/v1/devices/${deviceId}/commands \\\n    -H "Authorization: Bearer <admin JWT>" -H "Content-Type: application/json" -d '{"type":"lock"}'`);
    });

    client.on("message", async (_topic, message) => {
        const command = JSON.parse(message.toString("utf8"));
        if (seen.has(command.id)) {
            console.log(`<- duplicate ${command.type} ${command.id}, re-acking`);
        }
        seen.add(command.id);
        console.log(`<- ${command.type} ${command.id}`, command.payload);

        await ack({ commandId: command.id, status: "acknowledged" });
        await ack({ commandId: command.id, status: "succeeded", result: { executedAt: new Date().toISOString() } });
        console.log(`-> succeeded ${command.id}`);
    });

    client.on("error", (error) => console.error("MQTT error:", error.message));

    process.on("SIGINT", async () => {
        await client.publishAsync(topics.status, JSON.stringify({ state: "offline" }), { qos: 1, retain: true });
        await client.endAsync();
        console.log("\nDisconnected (offline published).");
        process.exit(0);
    });
}

main().catch((error) => {
    console.error("\nMock MQTT device failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
