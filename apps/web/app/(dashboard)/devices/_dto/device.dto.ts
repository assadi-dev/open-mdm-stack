import { z } from "zod";
import { DEVICE } from "@/constants/device";
import { toPaginatedSchema } from "@/lib/api/dto/pagination.dto";

// Les statuts que `device_overview` produit. Pas de « conforme » ni « non conforme » : aucune politique n'est évaluée.
export const DEVICE_STATUS_KEYS = ["pending", "offline", "commandRunning", "online"] as const;

// La limite de l'API (`updateDeviceSchema`).
const NAME_MAX_LENGTH = 100;

// Ce que `GET /devices` renvoie pour chaque appareil. Le nom, le modèle, le n° de série, la version d'Android et le porteur sont
// facultatifs côté API ; la batterie est `null` tant qu'elle n'a jamais été remontée, les deux dates quand l'appareil n'a jamais été vu.
export const deviceSchema = z.object({
  id: z.string(),
  // Le nom donné par un administrateur, tel qu'enregistré : il préremplit le formulaire de modification.
  name: z.string().nullable(),
  // Ce nom, sinon le modèle : la première ligne de la cellule « Appareil ».
  displayName: z.string().nullable(),
  serial: z.string().nullable(),
  androidId: z.string().nullable(),
  model: z.string().nullable(),
  brand: z.string().nullable(),
  androidVersion: z.string().nullable(),
  sdkVersion: z.number().int().nullable(),
  assignedToUserId: z.string().nullable(),
  assignedToName: z.string().nullable(),
  status: z.enum(DEVICE_STATUS_KEYS),
  battery: z.number().min(0).max(100).nullable(),
  lastHeartbeatAt: z.iso.datetime().nullable(),
  presenceChangedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

const deviceCollectionSchema = toPaginatedSchema(deviceSchema);

// Ce que `GET /devices/summary` renvoie : le parc entier, que la recherche et les filtres du tableau ne réduisent pas.
export const deviceSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.record(z.enum(DEVICE_STATUS_KEYS), z.number().int().nonnegative()),
  // Les versions d'Android présentes dans le parc, les plus récentes d'abord.
  androidVersions: z.array(
    z.object({
      sdkVersion: z.number().int(),
      androidVersion: z.string().nullable(),
      count: z.number().int().nonnegative(),
    }),
  ),
});

// Le formulaire manipule des textes : un nom vide l'efface côté API (`null`) et la liste retombe sur le modèle.
// Il ne porte que le nom : le reste (version d'Android, SDK) est remonté par l'appareil lui-même.
export const deviceFormSchema = z.object({
  name: z.string().trim().max(NAME_MAX_LENGTH, DEVICE.validation.nameTooLong),
});

export const DeviceDto = {
  parse: (data: unknown) => deviceSchema.parse(data),
  parseCollection: (data: unknown) => deviceCollectionSchema.parse(data),
  parseSummary: (data: unknown) => deviceSummarySchema.parse(data),
};
