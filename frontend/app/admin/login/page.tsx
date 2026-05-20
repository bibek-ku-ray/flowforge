import LoginForm from "@/features/auth/components/login-form";
import { getSession } from "@/lib/auth-utils";
import { isAdminRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function AdminLoginPage() {
  const session = await getSession();

  if (session && isAdminRole(session.user.role)) {
    redirect("/admin/users");
  }

  if (session) {
    redirect("/workflows");
  }

  return <LoginForm callbackURL="/admin/users" />;
}
