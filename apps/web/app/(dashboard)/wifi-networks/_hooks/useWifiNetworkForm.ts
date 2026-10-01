import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { buildWifiNetworkFormSchema } from "../_dto/wifi-network.dto";
import { toCreateInput, toUpdateInput } from "../_services/wifi-networks.utils";
import type { WifiNetwork, WifiNetworkFormValues } from "../_types/wifi-network.types";
import { useWifiNetworkMutation } from "./useWifiNetworkMutation";

const DEFAULT_SECURITY = "WPA2";

type UseWifiNetworkFormOptions = {
  // Présent : le formulaire modifie ce réseau. Absent : il en ajoute un.
  network?: WifiNetwork;
  onSuccess: () => void;
};

export const useWifiNetworkForm = ({ network, onSuccess }: UseWifiNetworkFormOptions) => {
  const { create, update } = useWifiNetworkMutation();
  const passwordRequired = !network || network.security === "NONE";
  const schema = useMemo(() => buildWifiNetworkFormSchema({ passwordRequired }), [passwordRequired]);

  const form = useForm<WifiNetworkFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: network?.name ?? "",
      ssid: network?.ssid ?? "",
      security: network?.security ?? DEFAULT_SECURITY,
      password: "",
    },
  });

  // La boîte de dialogue se ferme à la réussite seulement : en cas d'échec, la saisie reste et le toast explique.
  const onSubmit = form.handleSubmit((values) => {
    if (network) update.mutate(toUpdateInput(network.id, values), { onSuccess });
    else create.mutate(toCreateInput(values), { onSuccess });
  });

  return { form, onSubmit, isPending: create.isPending || update.isPending };
};
