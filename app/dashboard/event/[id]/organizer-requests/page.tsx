"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, deleteField } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import ManageRequestsTable from "@/components/ManageRequestsTable";

interface EventRequest {
  id: string;
  eventId: string;
  participantName: string;
  requestingUser: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    photoURL: string;
  };
  status: "pending" | "approved" | "rejected";
}

export default function OrganizerRequestsPage() {
  const params = useParams();
  const eventId = params?.id;
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "event_requests"));
        const eventRequests = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            if (!data.eventId || !data.status || !data.participantName || !data.requestingUser) {
              console.warn(`Invalid request data for document ${doc.id}`);
              return null;
            }
            return { id: doc.id, ...data } as EventRequest;
          })
          .filter((req): req is EventRequest => req !== null)
          .filter((req) => req.eventId === eventId && req.status === "pending");

        setRequests(eventRequests);
      } catch (error) {
        console.error("Error fetching participation requests:", error);
        toast.error("Failed to fetch participation requests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [eventId]);

  const handleDecision = async (requestId: string, decision: "approved" | "rejected") => {
    try {
      const requestDoc = doc(db, "event_requests", requestId);

      await updateDoc(requestDoc, { status: decision });

      if (decision === "approved") {
        const request = requests.find((req) => req.id === requestId);
        if (!request) throw new Error("Request not found");

        const eventRef = doc(db, "events", eventId!);
        const eventDoc = await getDoc(eventRef);
        if (!eventDoc.exists()) throw new Error("Event not found.");

        const eventData = eventDoc.data();
        const { participants } = eventData;

        const participantId = Object.keys(participants).find((key) => {
          const participant = participants[key];
          return `${participant.firstName} ${participant.lastName}` === request.participantName;
        });

        if (!participantId) {
          throw new Error(`Participant with name "${request.participantName}" not found in event.`);
        }

        await updateDoc(eventRef, { [`participants.${participantId}`]: deleteField() });

        await updateDoc(eventRef, {
          [`participants.${request.requestingUser.userId}`]: {
            ...request.requestingUser,
            confirmed: true,
          },
        });

        toast.success("Participant approved and added to the event.");
      } else if (decision === "rejected") {
        await deleteDoc(requestDoc);
        toast.info("Request rejected and removed from the list.");
      }

      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to process the request.");
    }
  };

  return (
    <ManageRequestsTable
      requests={requests}
      handleDecision={handleDecision}
      isLoading={loading}
    />
  );
}
