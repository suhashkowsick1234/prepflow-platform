import React, { useRef, useEffect, useState } from "react";
import { LearningWorkspace } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { Edit3, Check } from "lucide-react";
import { motion } from "framer-motion";

export function PersonalNotesModule({ workspace }: { workspace: LearningWorkspace }) {
  const { currentSessionId, notes, saveNotes, animationsEnabled } = useWorkspaceStore();
  const sessionId = currentSessionId || workspace.title;
  
  const [content, setContent] = useState(notes[sessionId] || "");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setContent(notes[sessionId] || "");
  }, [sessionId, notes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(sessionId, value);
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 2000);
    }, 500);
  };

  return (
    <motion.div
      initial={animationsEnabled ? { opacity: 0, y: 10 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-semibold flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-primary" />
          Personal Notes
        </h2>
        <div className="text-sm text-muted-foreground h-5 flex items-center">
          {isSaving && (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 text-green-500"
            >
              <Check className="w-3 h-3" /> Saved
            </motion.span>
          )}
        </div>
      </div>
      
      <Card className="flex-1 min-h-[400px] border-border/50 shadow-sm flex flex-col overflow-hidden">
        <Textarea
          value={content}
          onChange={handleChange}
          placeholder="Jot down your thoughts, reminders, and extra resources here. This is automatically saved for this topic."
          className="flex-1 resize-none border-0 focus-visible:ring-0 p-6 text-base bg-transparent rounded-none h-full min-h-[400px]"
        />
      </Card>
    </motion.div>
  );
}
