// src/app/dashboard/event/[id]/organizer-requests/_components/manage-requests-table.tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { handleRequestDecision } from "../actions";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Dit is de datastructuur die de component verwacht, al verwerkt door de server.
export interface ProcessedRequest {
  id: string; // Request ID
  status: "pending" | "approved" | "rejected";
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoURL?: string | null;
  };
}

interface ManageRequestsTableProps {
  requests: ProcessedRequest[];
  eventId: string;
}

export function ManageRequestsTable({ requests, eventId }: ManageRequestsTableProps) {
  const [isPending, startTransition] = useTransition();

  const onDecision = (requestId: string, decision: "approved" | "rejected") => {
    startTransition(async () => {
      const result = await handleRequestDecision(eventId, requestId, decision);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="border shadow-md rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Naam</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={req.user.photoURL ?? undefined} alt={req.user.firstName} />
                    <AvatarFallback>{getInitials(`${req.user.firstName} ${req.user.lastName}`)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{req.user.firstName} {req.user.lastName}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{req.user.email}</TableCell>
              <TableCell className="text-center">
                <Badge variant={req.status === 'pending' ? 'secondary' : req.status === 'approved' ? 'default' : 'destructive'}>
                  {req.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {req.status === "pending" && (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDecision(req.id, "rejected")}
                      disabled={isPending}
                    >
                      Wijs af
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onDecision(req.id, "approved")}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Keur goed'}
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {requests.length === 0 && (
         <div className="text-center p-8 text-muted-foreground">
            Er zijn momenteel geen openstaande aanvragen.
         </div>
      )}
    </div>
  );
}