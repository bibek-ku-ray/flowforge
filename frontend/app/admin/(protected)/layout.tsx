import { requireAdmin } from "@/lib/auth-utils";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return children;
}
