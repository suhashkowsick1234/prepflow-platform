import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ModuleErrorProps {
  moduleName?: string;
  error?: string | null;
  onRetry: () => void;
}

export function ModuleError({ moduleName = "module", error, onRetry }: ModuleErrorProps) {
  return (
    <Card className="max-w-xl mx-auto border-destructive/20 bg-destructive/5 shadow-md my-8">
      <CardContent className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold">Failed to load {moduleName}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error ?? "The server encountered a temporary issue generating this section."}
          </p>
        </div>
        <Button onClick={onRetry} variant="default" className="rounded-full px-6 gap-2">
          <RotateCcw className="w-4 h-4" /> Retry Loading
        </Button>
      </CardContent>
    </Card>
  );
}
