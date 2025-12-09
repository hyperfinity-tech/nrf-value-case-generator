import { redirect } from "next/navigation";
import { auth } from "../(auth)/auth";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  // Redirect to the Value Case Generator as the default page
  redirect("/abm");
}
