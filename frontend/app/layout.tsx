import type { Metadata } from "next";
import { JetBrains_Mono, Roboto_Slab } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-roboto-slab",
});

const jetbrainsMonoHeading = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-heading",
});

export const metadata: Metadata = {
  title: "FlowForge",
  description: "Workflow automation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full dark antialiased",
        robotoSlab.variable,
        jetbrainsMonoHeading.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <TRPCReactProvider>
          <TooltipProvider>
            {" "}
            <NuqsAdapter>{children}</NuqsAdapter>{" "}
          </TooltipProvider>
        </TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}