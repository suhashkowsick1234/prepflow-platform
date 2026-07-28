import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ModuleSkeletonProps {
  title?: string;
  type?: "cards" | "quiz" | "list" | "code" | "default";
}

export function ModuleSkeleton({ title = "Loading content...", type = "default" }: ModuleSkeletonProps) {
  if (type === "cards") {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Card className="border-border/50 h-80 flex flex-col justify-between p-8">
          <Skeleton className="h-4 w-28 rounded" />
          <div className="space-y-3 my-auto">
            <Skeleton className="h-6 w-3/4 mx-auto rounded" />
            <Skeleton className="h-6 w-1/2 mx-auto rounded" />
          </div>
          <Skeleton className="h-4 w-32 mx-auto rounded" />
        </Card>
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
    );
  }

  if (type === "quiz") {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Card className="p-6 md:p-8 space-y-6 border-border/50">
          <Skeleton className="h-8 w-5/6 rounded-lg" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-7 w-56 rounded-lg" />
      </div>
      <Card className="p-6 space-y-4 border-border/50">
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 space-y-3 border-border/50">
            <Skeleton className="h-5 w-1/2 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </Card>
        ))}
      </div>
    </div>
  );
}
