"use client";

import { Asterisk } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

export default function RequiredFieldMarker() {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className="text-[#b34c4c] text-base leading-none align-middle inline-flex ml-0.5 relative -top-1"
          >
            <Asterisk
              className="h-4 w-4 cursor-pointer"
              style={{ transform: "rotate(-30deg)" }}
            />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={4}
            className="bg-slate-50 text-chart-5 text-xs z-50 rounded-md py-2 px-2 shadow-lg"
          >
            Dit veld is nodig
            <Tooltip.Arrow className="fill-slate-50" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
