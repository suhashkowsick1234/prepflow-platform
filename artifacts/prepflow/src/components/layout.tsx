import React from "react";
import { Link, useLocation } from "wouter";
import { Brain, Moon, Sun, Download, Trash2, User, LogOut, BookOpen, Sparkles } from "lucide-react";
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
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-md shadow-primary/20">
              <Brain className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              PrepFlow <span className="text-primary">AI</span>
            </span>
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

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full w-9 h-9 border border-border/50"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Auth Button / Avatar Dropdown */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-primary/30">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                        {user?.name ? user.name[0] : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 align-end" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user?.email ?? user?.phone}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 h-4" />
                    <span>Profile & Stats</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 h-4" />
                    <span>Saved Sessions</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-rose-500 focus:text-rose-500">
                    <LogOut className="mr-2 h-4 h-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={openLoginModal}
                size="sm"
                className="rounded-full font-bold px-4 gap-1.5 text-xs shadow-md shadow-primary/20"
              >
                <Sparkles className="w-3.5 h-3.5" /> Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full h-full">{children}</main>

      <LoginModal />
    </div>
  );
}
