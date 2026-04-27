"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import {
  Clock12Icon,
  CreditCardIcon,
  FolderOpenIcon,
  KeyIcon,
  LogOutIcon,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
  {
    title: "Workflow",
    items: [
      {
        title: "Workflow",
        icon: FolderOpenIcon,
        url: "/workflows",
      },
      {
        title: "Credentials",
        icon: KeyIcon,
        url: "/credentials",
      },
      {
        title: "Executions",
        icon: Clock12Icon,
        url: "/executions",
      },
    ],
  },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="gap-x-4 h-10 px-4">
              <Link href="/workflows" prefetch>
                <Image
                  src="/logos/logo.png"
                  alt="Flowforge"
                  width={20}
                  height={20}
                />
                <span className="font-semibold">Flowforge</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={
                        item.url === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.url)
                      }
                      asChild
                      className="gap-x-4 h-10 px-4"
                    >
                      <Link href={item.url} prefetch>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={`Upgrade`}
              className="gap-x-4 h-10 px-4"
              onClick={() => {}}
            >
              <StarIcon className="h-4 w-4" />
              Upgrade
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={`Billing`}
              className="gap-x-4 h-10 px-4"
              onClick={() => {}}
            >
              <CreditCardIcon className="h-4 w-4" />
              Billing
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={`Sign out`}
              className="gap-x-4 h-10 px-4"
              onClick={() => {
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/login")
                    }
                  }
                })
              }}
            >
              <LogOutIcon className="h-4 w-4" />
              Sign out
            </SidebarMenuButton>
          </SidebarMenuItem>
          
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
