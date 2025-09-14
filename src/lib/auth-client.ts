import { createAuthClient } from "better-auth/react";
import { publicEnv } from "~/config/publicEnv";

export const authClient = createAuthClient({
  baseURL: publicEnv.HOST_NAME,
});
