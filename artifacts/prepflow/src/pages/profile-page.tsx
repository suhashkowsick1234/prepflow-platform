import React, { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Flame,
  BookOpen,
  Layers,
  Target,
  Bookmark,
  Clock,
  Trash2,
  ArrowRight,
  LogOut,
  Sparkles,
  Edit3,
  Check,
  X,
} from "lucide-react";

export function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user, isLoggedIn, logout, openLoginModal, updateUserProfile } = useAuth();
  const {
    sessions,
    bookmarks,
    deleteSession,
    setCurrentSession,
    getOverallAccuracy,
    getTotalFlashcardsLearned,
    getStudyStreak,
  } = useWorkspaceStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "User");
  const [editEmail, setEditEmail] = useState(user?.email ?? user?.phone ?? "user@prepflow.app");

  const sessionsList = Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt);
  const totalTopics = sessionsList.length;
  const overallAccuracy = getOverallAccuracy();
  const totalFlashcardsLearned = getTotalFlashcardsLearned();
  const streak = getStudyStreak();

  const handleOpenSession = (id: string) => {
    setCurrentSession(id);
    setLocation("/workspace");
  };

  const handleStartEditing = () => {
    setEditName(user?.name ?? "User");
    setEditEmail(user?.email ?? user?.phone ?? "user@prepflow.app");
    setIsEditing(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      updateUserProfile(editName.trim(), editEmail.trim());
      setIsEditing(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 md:py-12 space-y-8">
        {/* User Header */}
        <Card className="border-border/60 shadow-xl overflow-hidden bg-card/60 backdrop-blur-xl relative">
          <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <CardContent className="p-6 md:p-8 relative z-10">
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-primary" /> Edit Profile Information
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Display Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" className="gap-1.5">
                    <Check className="w-4 h-4" /> Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="gap-1.5"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
                  <Avatar className="w-20 h-20 border-4 border-primary/20 shadow-md">
                    <AvatarImage src={user?.avatar} alt={user?.name ?? "User"} />
                    <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                      {user?.name ? user.name[0] : "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <h1 className="text-2xl md:text-3xl font-bold font-display">
                        {user?.name ?? "Guest Student"}
                      </h1>
                      {isLoggedIn && (
                        <Badge variant="outline" className="border-primary/40 text-primary capitalize text-xs">
                          {user?.provider} User
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                      {user?.email ?? user?.phone ?? "Sign in to save progress permanently across sessions"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleStartEditing} className="gap-2">
                    <Edit3 className="w-4 h-4 text-primary" /> Edit Profile
                  </Button>

                  {isLoggedIn ? (
                    <Button variant="outline" size="sm" onClick={logout} className="gap-2 border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </Button>
                  ) : (
                    <Button onClick={openLoginModal} size="sm" className="gap-2 rounded-full font-bold">
                      <Sparkles className="w-4 h-4" /> Sign In
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60 bg-gradient-to-br from-amber-500/10 to-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-500">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono text-foreground">{streak}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">Day Streak</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-gradient-to-br from-blue-500/10 to-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-500">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono text-foreground">{totalTopics}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">Topics Saved</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-gradient-to-br from-emerald-500/10 to-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-500">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono text-foreground">{totalFlashcardsLearned}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">Bookmarked</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-gradient-to-br from-purple-500/10 to-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-500">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono text-foreground">{overallAccuracy}%</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">Quiz Accuracy</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saved Sessions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Saved Study Workspaces ({sessionsList.length})
            </h2>
          </div>

          {sessionsList.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
              <p>No saved workspaces yet.</p>
              <Button onClick={() => setLocation("/")} className="mt-4 rounded-full font-bold">
                Generate Your First Workspace
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessionsList.map((session) => (
                <motion.div key={session.id} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                  <Card className="h-full border-border/60 hover:border-primary/50 cursor-pointer transition-all flex flex-col justify-between group">
                    <CardContent className="p-5 flex flex-col h-full justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {session.workspace.difficulty}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(session.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <h3 className="font-semibold font-display text-lg group-hover:text-primary transition-colors line-clamp-1">
                          {session.workspace.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {session.workspace.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenSession(session.id)}
                          className="h-8 text-xs gap-1 font-semibold group-hover:text-primary"
                        >
                          Open Workspace <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-rose-500 rounded transition-colors"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
