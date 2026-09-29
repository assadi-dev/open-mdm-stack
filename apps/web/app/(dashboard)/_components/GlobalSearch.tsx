import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/inputs/InputGroup";
import { HEADER } from "@/constants/header";

export const GlobalSearch = () => (
  <InputGroup className="hidden w-75 lg:flex">
    <InputGroupInput type="search" placeholder={HEADER.search.placeholder} aria-label={HEADER.search.label} />
    <InputGroupAddon align="inline-end">
      <Search className="size-5" />
    </InputGroupAddon>
  </InputGroup>
);
