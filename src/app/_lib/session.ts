import { cookies } from "next/headers";
import { USER_COOKIE, userFromCookie, type UserId } from "@/core/auth/access";

/** The demo user for server components (pages and the layout). */
export async function pageUser(): Promise<UserId> {
  return userFromCookie((await cookies()).get(USER_COOKIE)?.value);
}
