import { Link } from "react-router";
import { useNavigate } from "react-router";
import { Bell, LogOut, Search, Settings, User } from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type DashboardHeaderProps = {
  userEmail?: string | null;
  userName?: string | null;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardHeader({
  userEmail,
  userName,
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const displayName = userName?.trim() || "Admin";
  const displayEmail = userEmail?.trim() || "Signed in";
  const initials = getInitials(displayName) || "NA";

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Sign out failed", {
        description: error.message,
      });
      return;
    }

    navigate("/login", { replace: true })
  }

  return (
    <header className="bg-background/80 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 hidden h-5 sm:block" />

      <div className="relative max-w-md flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search resources, categories…"
          className="bg-muted/40 h-9 border-transparent pl-9 shadow-none focus-visible:bg-background"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
              />
            }
          >
            <Bell className="size-4" />
            <Badge className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full p-0 text-[10px]">
              3
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2.5">
                <span className="font-medium">New resource uploaded</span>
                <span className="text-muted-foreground text-xs">
                  Brand Guidelines 2026 · 12 min ago
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2.5">
                <span className="font-medium">Category created</span>
                <span className="text-muted-foreground text-xs">
                  Compliance · 48 min ago
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2.5">
                <span className="font-medium">Download surge</span>
                <span className="text-muted-foreground text-xs">
                  Sales Playbook Q3 hit 1.5K · 2 hours ago
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-9 gap-2 px-2"
                aria-label="User menu"
              />
            }
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">
              {displayName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-foreground font-medium">
                    {displayName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {displayEmail}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link to="/dashboard/settings" />}>
                <User />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to="/dashboard/settings" />}>
                <Settings />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
