import z from "zod";

export const arrayFilters = z.object({
    in: z.array(z.string()).optional(),
    order: z.enum(["asc", "desc"]).default("desc"),
    limit: z.number().default(20),
    page: z.number().default(1),
    search: z.string().optional(),
    orderColumn: z.string().optional(),

})

export interface ArrayFilters extends z.infer<typeof arrayFilters> { }