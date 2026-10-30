import { notFound } from "next/navigation";

// Any unknown URL under a locale renders the (translated) not-found page.
export default function CatchAll() {
  notFound();
}
