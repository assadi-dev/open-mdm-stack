import z from "zod";



export const apkSchema = z.object({
    versionName: z.string(),
    versionCode: z.number(),
    packageName: z.string(),
    name: z.string(),
    size: z.number()
})