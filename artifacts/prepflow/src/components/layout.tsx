import React from "react";
import { Link, useLocation } from "wouter";
import { Moon, Sun, Download, Trash2, User, LogOut } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoginModal } from "@/components/auth/login-modal";
import { AppLogo } from "@/components/ui/app-logo";
import { LearningWorkspace } from "@workspace/api-client-react";

interface LayoutProps {
  children: React.ReactNode;
  showWorkspaceActions?: boolean;
  workspace?: LearningWorkspace;
}

export function Layout({ children, showWorkspaceActions, workspace }: LayoutProps) {
  const { theme, setTheme } = useTheme();
  const { currentSessionId, deleteSession } = useWorkspaceStore();
  const { user, isLoggedIn, openLoginModal, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleExportMarkdown = () => {
    if (!workspace) return;
    let md = `# ${workspace.title}\n\n${workspace.description}\n\n## Summary\n${workspace.summary}\n\n`;
    md += `## Key Points\n`;
    workspace.keyPoints.forEach((p) => (md += `- ${p}\n`));
    md += `\n## Flashcards\n`;
    workspace.flashcards.forEach((f) => (md += `**Q:** ${f.front}\n**A:** ${f.back}\n\n`));

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workspace.title.replace(/\s+/g, "-").toLowerCase()}-prepflow.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!workspace) return;
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workspace.title.replace(/\s+/g, "-").toLowerCase()}-prepflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/30 selection:text-primary">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl h-16 flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <AppLogo size={42} showText />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {showWorkspaceActions && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <Button variant="ghost" size="sm" onClick={handleExportMarkdown} className="text-xs h-8">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> MD
                </Button>
                <Button variant="ghost" size="sm" onClick={handleExportJSON} className="text-xs h-8">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="text-xs h-8">
                  Print PDF
                </Button>
                {currentSessionId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      deleteSession(currentSessionId);
                      setLocation("/");
                    }}
                    className="text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                  </Button>
                )}
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-xl"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </Button>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={user?.avatar} alt={user?.name ?? "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email ?? user?.phone}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2 text-primary" /> Profile & Stats
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-rose-500 focus:text-rose-500">
                    <LogOut className="w-4 h-4 mr-2" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={openLoginModal} size="sm" className="rounded-xl px-4 text-xs font-semibold">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <LoginModal />
    </div>
  );
}

export default Layout;
