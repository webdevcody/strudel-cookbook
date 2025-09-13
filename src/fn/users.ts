import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { findUserById } from "~/data-access/users";
import { findSoundsByUserId } from "~/data-access/sounds";

export const getUserProfileFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const user = await findUserById(data.userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  });

export const getUserSoundsByIdFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    return await findSoundsByUserId(data.userId);
  });