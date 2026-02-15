import { redirect } from "next/navigation";
import { getSessionOrNull } from "@/lib/auth/session";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  const session = await getSessionOrNull();
  const activeOrganizationId =
    session?.session?.activeOrganizationId ??
    session?.session?.activeOrganization?.id ??
    session?.activeOrganizationId ??
    session?.activeOrganization?.id ??
    null;

  if (activeOrganizationId) {
    redirect("/dashboard");
  }

  if (session) {
    redirect("/org/select");
  }

  return <SignInForm />;
}
