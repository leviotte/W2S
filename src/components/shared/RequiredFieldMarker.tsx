"use client";

import { Asterisk } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TooltipArrow,
} from "@/components/ui/tooltip"; // Best practice: importeren uit je eigen UI-lib

export function RequiredFieldMarker() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-destructive text-base leading-none align-middle inline-flex ml-0.5 relative -top-px">
            <Asterisk className="h-3 w-3 cursor-default" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={4}>
          <p>Dit veld is verplicht</p>
          <TooltipArrow />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default RequiredFieldMarker;