import { z } from "zod";

// Réponse d'une collection paginée de l'API (`GET /<ressource>?page&limit&search&sort&<filtre>`) : la page de lignes et le total.
export const paginationMetadataSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const toPaginatedSchema = <TItem extends z.ZodType>(item: TItem) =>
  z.object({
    data: z.array(item),
    metadata: paginationMetadataSchema,
  });
