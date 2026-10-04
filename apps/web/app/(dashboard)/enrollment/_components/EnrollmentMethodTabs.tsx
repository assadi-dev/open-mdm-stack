import { QrCode, Terminal, type LucideIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/tabs/Tabs";
import { ENROLLMENT } from "@/constants/enrollment";
import { ENROLLMENT_METHOD_KEYS } from "../_dto/enrollment.dto";
import { isEnrollmentMethod } from "../_services/enrollment.utils";
import type { EnrollmentMethod } from "../_types/enrollment.types";

const METHOD_ICONS: Record<EnrollmentMethod, LucideIcon> = {
  qr: QrCode,
  manual: Terminal,
};

type EnrollmentMethodTabsProps = {
  method: EnrollmentMethod;
  onMethodChange: (method: EnrollmentMethod) => void;
};

export const EnrollmentMethodTabs = ({ method, onMethodChange }: EnrollmentMethodTabsProps) => (
  <Tabs value={method} onValueChange={(value) => isEnrollmentMethod(value) && onMethodChange(value)}>
    <TabsList aria-label={ENROLLMENT.methods.label}>
      {ENROLLMENT_METHOD_KEYS.map((key) => {
        const Icon = METHOD_ICONS[key];
        return (
          <TabsTrigger key={key} value={key}>
            <Icon aria-hidden="true" />
            {ENROLLMENT.methods[key].tab}
          </TabsTrigger>
        );
      })}
    </TabsList>
  </Tabs>
);
