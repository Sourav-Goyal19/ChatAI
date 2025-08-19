import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VersionNavigationProps {
  versionInfo: { current: number; total: number };
  onNavigate: (direction: "prev" | "next") => void;
}

export const VersionNavigation: React.FC<VersionNavigationProps> = ({
  versionInfo,
  onNavigate,
}) => {
  return (
    <div className="flex items-center justify-end gap-2 mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => onNavigate("prev")}
        disabled={versionInfo.current === 1}
      >
        <ChevronLeft className="h-3 w-3" />
      </Button>
      <span className="text-xs text-muted-foreground px-2">
        {versionInfo.current} / {versionInfo.total}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => onNavigate("next")}
        disabled={versionInfo.current === versionInfo.total}
      >
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
};
