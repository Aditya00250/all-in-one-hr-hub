import { createFileRoute, Outlet, redirect, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
  SidebarTrigger, SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Building2, LayoutDashboard, Users, Building, UserCircle, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/departments", label: "Departments", icon: Building },
  { to: "/profile", label: "My profile", icon: UserCircle },
] as const;

function AuthedLayout() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-sidebar-foreground">Acme HRMS</span>
                <span className="text-[10px] text-sidebar-foreground/60">People Operations</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={pathname.startsWith(item.to)}>
                        <Link to={item.to}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-2 px-2 py-2">
              <Avatar className="h-8 w-8"><AvatarFallback>{initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.email}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-background flex items-center px-4 gap-2 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="ml-2 text-sm font-medium capitalize">
              {pathname.split("/").filter(Boolean).join(" / ") || "dashboard"}
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
