import Link from "next/link";
import { ShieldIcon, SlidersHorizontalIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/triggers", label: "Triggers", icon: SlidersHorizontalIcon },
];

export function AdminShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="min-h-[100dvh] bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <ShieldIcon className="size-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-medium tracking-tight text-zinc-500">
                FlowForge Admin
              </p>
              <p className="text-base font-semibold tracking-tight text-zinc-900">
                Control plane
              </p>
            </div>
          </div>
          <Link
            href="/workflows"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
          >
            Back to app
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[220px_1fr] md:px-8">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <AdminNavLink key={item.href} href={item.href} icon={item.icon}>
              {item.label}
            </AdminNavLink>
          ))}
        </nav>

        <section className="min-w-0">
          <div className="mb-8 border-b border-zinc-200 pb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-zinc-600">
                {description}
              </p>
            ) : null}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

function AdminNavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900",
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {children}
    </Link>
  );
}
