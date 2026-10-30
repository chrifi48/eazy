import "server-only";
import { auth } from "./auth";
import { from } from "./query";

/** Request-scoped client: database + the current admin session. */
export const createClient = () => ({ from, auth });
