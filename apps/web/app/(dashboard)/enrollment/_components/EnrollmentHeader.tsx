import { ENROLLMENT } from "@/constants/enrollment";
import { PageHeader } from "../../_components/PageHeader";
import { toBreadcrumbs } from "../_services/enrollment.utils";
import type { EnrollmentMethod } from "../_types/enrollment.types";

type EnrollmentHeaderProps = {
  method: EnrollmentMethod;
};

export const EnrollmentHeader = ({ method }: EnrollmentHeaderProps) => (
  <PageHeader
    title={ENROLLMENT.page.title}
    subtitle={ENROLLMENT.methods[method].subtitle}
    breadcrumbs={toBreadcrumbs(method)}
  />
);
