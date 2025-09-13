import { redirect } from "@tanstack/react-router";
import { getHeaders } from "@tanstack/react-start/server";
import { auth } from "~/utils/auth";
import { createServerFn } from "@tanstack/react-start";

export const assertAuthenticatedFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const headers = getHeaders();
    const session = await auth.api.getSession({
      headers: headers as unknown as Headers,
    });
    if (!session) {
      throw redirect({ to: "/unauthenticated" });
    }
  }
);
