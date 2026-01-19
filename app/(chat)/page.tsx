import { redirect } from "next/navigation";

export default async function Page() {
  // Redirect to the Value Case Generator as the default page
  // Auth is handled by middleware
  redirect("/abm");
}
