import { redirect } from "next/navigation";
import { getActiveOrganizationId, getSessionOrNull } from "@/lib/auth/session";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  const session = await getSessionOrNull();
  const activeOrganizationId = getActiveOrganizationId(session);

  if (activeOrganizationId) {
    redirect("/dashboard");
  }

  return <SignInForm />;
}
