import { eq } from "drizzle-orm";
import { database } from "~/db";
import { user, type User } from "~/db/schema";

export async function findUserById(
  id: string
): Promise<Pick<User, "id" | "name" | "image" | "createdAt"> | null> {
  const [result] = await database
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  return result || null;
}
