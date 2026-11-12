import { redirect } from "next/navigation";

/** Courses and workshops now share one overview on the homepage. */
export default function TeachingPage() {
  redirect("/#teaching");
}
