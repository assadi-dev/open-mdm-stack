import z from "zod";

// Body EMQX's HTTP authenticator posts on every CONNECT (see dependencies/emqx/emqx.conf).
export const mqttAuthSchema = z.object({
    clientid: z.string(),
    username: z.string().optional().default(""),
    password: z.string().optional().default(""),
});

export type MqttAuthInput = z.infer<typeof mqttAuthSchema>;

export const mqttDecoder = {
    auth: (data: unknown) => mqttAuthSchema.safeParse(data),
};
