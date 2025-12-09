// src/app/dashboard/event/[id]/invites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Copy, MessageCircle } from "lucide-react"; // Gebruik lucide icoon voor whatsapp
import { toast } from "sonner";
import InviteMethodCard from "@/components/invites/InviteMethodCard"; // Zorg dat dit pad correct is
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function EventInvitesPage({ params }: { params: { id: string } }) {
  const { id: eventId } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "invitation";

  const { events, currentUser, updateEvent } = useAuthStore();
  const event = events.find(e => e.id === eventId);
  
  // Verbetering: We forceren een redirect als de data niet klaar is.
  useEffect(() => {
    if (!currentUser || !event) {
      toast.error("Event of gebruiker niet gevonden, je wordt teruggestuurd.");
      router.replace("/dashboard");
    }
  }, [currentUser, event, router]);

  // Als de data er niet is, render dan niets of een loader.
  if (!currentUser || !event) {
    return null; // Of een loading spinner
  }

  // === DE FIX: Link naar de nieuwe, correcte join pagina ===
  const eventLink = `${window.location.origin}/event/${event.id}/join`;

  const deadlineText = event.registrationDeadline
    ? `\n\nDe deadline is: ${new Date(event.registrationDeadline).toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" })}`
    : "";

  let emailSubject, messageBody, pageTitle, pageSubtitle, sectionTitle;

  // Robuuste switch-case met default waarden
  switch (type) {
    case "drawn":
      pageTitle = "Herinnering Lootjes Trekken";
      pageSubtitle = "Stuur een herinnering naar deelnemers.";
      sectionTitle = "Stuur herinnering";
      emailSubject = `Herinnering: lootje trekken voor ${event.name}`;
      messageBody = `Hallo!\n\nVergeet niet je lootje te trekken voor ${event.name}. De spanning stijgt! Klik hieronder om te zien voor wie jij de verrassing mag zijn.\n\nTrek je lootje: ${eventLink}${deadlineText}\n\nFeestelijke groetjes,\nHet Wish2Share-Team`;
      break;
    case "wishlist":
      pageTitle = "Verzoek voor Wenslijst";
      pageSubtitle = "Herinner deelnemers om hun wenslijst in te vullen.";
      sectionTitle = "Verzend wenslijst-verzoek";
      emailSubject = `Actie vereist: vul je wenslijst in voor ${event.name}`;
      messageBody = `Hallo!\n\nWe missen je wenslijst nog voor ${event.name}. Help je geheime koper een handje en voeg snel je wensen toe!\n\nVoeg je wenslijst toe: ${eventLink}${deadlineText}\n\nFeestelijke groetjes,\nHet Wish2Share-Team`;
      break;
    // Voeg hier eventueel andere cases toe
    default:
      pageTitle = "Verstuur Uitnodiging";
      pageSubtitle = `Nodig vrienden uit voor: ${event.name}`;
      sectionTitle = "Deel de uitnodiging";
      emailSubject = `${currentUser.profile.firstName} nodigt je uit voor ${event.name}`;
      messageBody = `Hallo,\n\nJe bent uitgenodigd voor ${event.name}! Klik op de link om deel te nemen.\n\nNeem deel via: ${eventLink}${deadlineText}\n\nGroetjes,\n${currentUser.profile.firstName}`;
      break;
  }

  const handleEmailShare = () => {
    const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(messageBody)}`;
    window.location.href = mailtoLink;
    toast.info("Open je e-mailprogramma om de uitnodiging te versturen.");
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(messageBody)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Link gedeeld via WhatsApp!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventLink);
    toast.success("Link gekopieerd naar het klembord!");
  };

  const handleDone = () => {
    router.replace(`/dashboard/event/${event.id}`);
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{pageTitle}</CardTitle>
          <CardDescription>{pageSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <h3 className="font-semibold">{sectionTitle}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <InviteMethodCard icon={Mail} title="Email" onClick={handleEmailShare} />
              <InviteMethodCard icon={MessageCircle} title="WhatsApp" onClick={handleWhatsAppShare} />
              {type === "invitation" && <InviteMethodCard icon={Copy} title="Kopieer Link" onClick={handleCopyLink} />}
            </div>
            <Separator />
            <div className="flex justify-center">
              <Button variant="ghost" onClick={handleDone}>
                Klaar, ga naar het evenement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}