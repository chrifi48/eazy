import "server-only";
import { from } from "./query";

/** Server-only database access (no session needed): booking, contact form, cron, emails. */
export const createAdminClient = () => ({ from });
