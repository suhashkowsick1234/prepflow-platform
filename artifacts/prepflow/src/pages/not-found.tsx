import React from "react";
import { Link } from "wouter";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="bg-muted p-6 rounded-full mb-6 text-muted-foreground">
        <Brain className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-bold font-display tracking-tight text-foreground mb-4">
        Page Not Found
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button size="lg">Return Home</Button>
      </Link>
    </div>
  );
}
