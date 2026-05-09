import { redirect } from "next/navigation";

export default function AdminFallbackRoute() {
  redirect("/admin");
}
