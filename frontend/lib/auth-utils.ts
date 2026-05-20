import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const getSession = async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
};

export const requireAuth = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
};

export const requireUnauth = async () => {
  const session = await getSession();

  if (session) {
    redirect("/");
  }
};

export const requireAdmin = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (!isAdminRole(session.user.role)) {
    redirect("/workflows");
  }

  return session;
};
