"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/inputs/InputGroup";
import { ACTION_LABELS } from "@/constants/actions";

type InputPasswordProps = Omit<ComponentProps<typeof InputGroupInput>, "type">;

export const InputPassword = ({ className, ...props }: InputPasswordProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup className={className}>
      <InputGroupInput type={visible ? "text" : "password"} {...props} />
      <InputGroupAddon align="inline-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={visible ? ACTION_LABELS.hidePassword : ACTION_LABELS.showPassword}
          onClick={() => setVisible((previous) => !previous)}
        >
          {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
};
