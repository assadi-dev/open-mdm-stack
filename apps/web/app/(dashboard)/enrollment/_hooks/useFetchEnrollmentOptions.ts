import { useQuery } from "@tanstack/react-query";
import { fetchEnrollmentOptionsApi } from "../_services/enrollment.api";
import { ENROLLMENTS } from "../_services/enrollment.queries";

export const useFetchEnrollmentOptions = () =>
  useQuery({ queryKey: ENROLLMENTS.options, queryFn: fetchEnrollmentOptionsApi });
