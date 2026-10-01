import { EllipsisVertical, Eye } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/menus/DropdownMenu";
import { DEVICE } from "@/constants/device";

type DeviceRowActionsProps = {
  deviceName: string;
};

export const DeviceRowActions = ({ deviceName }: DeviceRowActionsProps) => (
  <div className="flex justify-end">
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${DEVICE.actionsFor} ${deviceName}`} />}>
        <EllipsisVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Eye />
          {DEVICE.button.viewDetail}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);
