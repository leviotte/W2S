// src/app/dashboard/event/[id]/invites/_components/invites-client.tsx
"use client";

import { useRouter } from "next/navigation";
import { Mail, MessageCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import InviteMethodCard from "@/components/invites/InviteMethodCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Event } from "@/types/event";
import type { UserProfile } from "@/types/user";

interface EventInvitesClientProps {
  event: Event;
  user: UserProfile;
  type: string;
}

export default function EventInvitesClient({ event, user, type }: EventInvitesClientProps) {
  const router = useRouter();
  
  // Geen useEffect of store meer nodig, data komt direct binnen als prop!
  const eventLink = `${window.location.origin}/event/${event.id}/join`;

  const deadlineText = event.registrationDeadline
    ? `\n\nDe deadline is: ${new Date(event.registrationDeadline).toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" })}`
    : "";

  let emailSubject, messageBody, pageTitle, pageSubtitle, sectionTitle;

  switch (type) {
    case "drawn":
      pageTitle = "Herinnering Lootjes Trekken";
      pageSubtitle = "Stuur een herinnering naar deelnemers.";
      sectionTitle = "Stuur herinnering";
      emailSubject = `Herinnering: lootje trekken voor ${event.name}`;
      messageBody = `Hallo!\n\Vergeet niet je lootje te trekken voor ${event.name}. De spanning stijgt! Klik hieronder om te zien voor wie jij de verrassing mag zijn.\n\Trek je lootje: ${eventLink}${deadlineText}\n\nFeestelijke groetjes,\nHet Wish2Share-Team`;
      break;
    case "wishlist":
      pageTitle = "Verzoek voor Wenslijst";
      pageSubtitle = "Herinner deelnemers om hun wenslijst in te vullen.";
      sectionTitle = "Verzend wenslijst-verzoek";
      emailSubject = `Actie vereist: vul je wenslijst in voor ${event.name}`;
      messageBody = `Hallo!\n\We missen je wenslijst nog voor ${event.name}. Help je geheime koper een handje en voeg snel je wensen toe!\n\Voeg je wenslijst toe: ${eventLink}${deadlineText}\n\nFeestelijke groetjes,\nHet Wish2Share-Team`;
      break;
    default: // "invitation"
      pageTitle = "Verstuur Uitnodiging";
      pageSubtitle = `Nodig vrienden uit voor: ${event.name}`;
      sectionTitle = "Deel de uitnodiging";
      emailSubject = `${user.firstName} nodigt je uit voor ${event.name}`;
      messageBody = `Hallo,\n\nJe bent uitgenodigd voor ${event.name}! Klik op de link om deel te nemen.\n\nNeem deel via: ${eventLink}${deadlineText}\n\nGroetjes,\n${user.firstName}`;
      break;
  }

  const handleEmailShare = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(messageBody)}`;
    toast.info("Open je e-mailprogramma om de uitnodiging te versturen.");
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(messageBody)}`, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventLink);
    toast.success("Link gekopieerd naar het klembord!");
  };

  const handleDone = () => {
    router.push(`/dashboard/event/${event.id}`);
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