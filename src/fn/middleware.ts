import { createMiddleware } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { auth } from "~/utils/auth";

export const authenticatedMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const request = getWebRequest();

  if (!request?.headers) {
    throw new Error("No headers");
  }
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw new Error("No session");
  }

  return next({
    context: { userId: session.user.id },
  });
});
