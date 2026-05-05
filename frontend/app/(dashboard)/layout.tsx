import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full flex-1">
        {/* <SidebarTrigger/> */}
        {children}
      </main>
    </SidebarProvider>
  );
};

export default layout;
