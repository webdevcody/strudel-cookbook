import { queryOptions } from "@tanstack/react-query";
import { getUserPlanFn } from "~/fn/subscriptions";

export const getUserPlanQuery = () =>
  queryOptions({
    queryKey: ["user-plan"],
    queryFn: () => getUserPlanFn(),
  });