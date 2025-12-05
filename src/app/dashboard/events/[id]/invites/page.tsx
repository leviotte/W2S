// app/dashboard/event/[id]/invites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store/use-auth-store";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Copy } from "lucide-react";
import { toast } from "sonner";
import  InviteMethodCard from "@/components/invites/InviteMethodCard";

export default function EventInvitesPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "invitation";

  const { events, currentUser, updateEvent } = useStore();
  const [isInvited, setIsInvited] = useState(false);

  const event = events.find(e => e.id === id);

  const userReady = !!currentUser && !!event;

  useEffect(() => {
    if (!userReady) {
      router.replace("/dashboard");
    }
  }, [userReady, router]);

  if (!userReady) return null;

  const eventLink = `${window.location.origin}/event/participation/${event.id}`;
  const deadlineText = event.registrationDeadline
    ? `\n\nDe registratie is open tot: ${new Date(event.registrationDeadline).toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
    : "";

  let emailSubject = "";
  let messageBody = "";
  let pageTitle = "Verstuur uitnodiging";
  let pageSubtitle = "Nodig deelnemers uit";
  let sectionTitle = "Deel de uitnodiging met de deelnemers";

  switch (type) {
    case "drawn":
      emailSubject = `${currentUser.firstName} herinnert je eraan om een lootje te trekken voor ${event.name}`;
      messageBody = `Hallo,\n\nHet lijkt erop dat iemand nog geen naam getrokken heeft… Oh ja, jij!\nJe zit al bij het event, maar je hebt nog geen naam getrokken. Spannend! Klik hieronder om jouw lootje te trekken.\n\nBekijk je lootje hier: ${eventLink}${deadlineText}\n\nFeestelijke groetjes,\nHet Wish2Share-Team`;
      pageTitle = "Herinner voor lootjes trekken";
      pageSubtitle = `Stuur een herinnering aan deelnemers om hun lootje te trekken.`;
      sectionTitle = "Stuur deze herinnering";
      break;

    case "wishlist":
      emailSubject = `${currentUser.firstName} vraagt je wishlist voor ${event.name}`;
      messageBody = `Hallo,\n\nWe missen nog een wishlist… Oh ja, die van jou!\nJe bent aangemeld voor het event, maar je wishlist ontbreekt nog. Voeg je wensen toe!\n\nVoeg je wishlist toe: ${eventLink}${deadlineText}\n\nFeestelijke groetjes,\nHet Wish2Share-Team`;
      pageTitle = "Verzoek wishlist";
      pageSubtitle = "Herinner deelnemers om hun wishlist in te vullen.";
      sectionTitle = "Verzend wishlist-verzoek";
      break;

    case "crossOff":
      emailSubject = `${currentUser.firstName} vraagt je om af te vinken wat je al kocht voor ${event.name}`;
      messageBody = `Hallo,\n\nJe lootje wacht nog op z'n cadeauheld (ja, jij dus)!\nCheck de wishlist, koop iets leuks en vink het af zodra je het koopt.\n\nBekijk en vink hier af: ${eventLink}${deadlineText}\n\nFeestelijke groetjes,\nHet Wish2Share-Team`;
      pageTitle = "Herinner voor afvinken";
      pageSubtitle = "Herinner deelnemers om hun cadeaus af te vinken.";
      sectionTitle = "Stuur afvink-herinnering";
      break;

    default:
      emailSubject = `${currentUser.firstName} nodigt je uit voor ${event.name}`;
      messageBody = `Hallo,\n\nJe maakt nu deel uit van de groep ${event.name}!\nBekijk het event hier: ${eventLink}${deadlineText}\n\nFeestelijke groeten,\nHet ${event.name} Team`;
      break;
  }

  useEffect(() => {
    if (isInvited && id) {
      updateEvent(id, { isInvited: true });
    }
  }, [isInvited, id, updateEvent]);

  const handleEmailShare = () => {
    router.push(`/dashboard/event/${id}/request/0?tab=event&subTab=request&type=${type}`);
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(messageBody)}`;
    window.open(whatsappUrl, "_blank");
    setIsInvited(true);
    toast.success("Uitnodigingslink gedeeld op WhatsApp!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventLink);
    setIsInvited(true);
    toast.success("Link gekopieerd naar het klembord.");
  };

  const handleSkip = () => {
    router.replace(`/dashboard/event/${event.id}?tab=events&subTab=details`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-600">{pageSubtitle}</p>
        </div>

        {!isInvited ? (
          <div className="mt-8 space-y-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">{sectionTitle}</h2>
            <div className="flex items-center justify-center gap-[30px]">
              <InviteMethodCard icon={Mail} title="Email" onClick={handleEmailShare} />
              <InviteMethodCard icon="whatsapp" title="WhatsApp" onClick={handleWhatsAppShare} />
              {type === "invitation" && <InviteMethodCard icon={Copy} title="Kopieer Link" onClick={handleCopyLink} />}
            </div>
            <div className="flex justify-center pt-6 border-t">
              <button onClick={handleSkip} className="text-gray-600 hover:text-gray-800">Sla over</button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-green-600 font-bold mt-4 text-center">Uitnodigingen zijn verstuurd!</p>
            <div className="flex justify-center pt-6">
              <button onClick={handleSkip} className="text-gray-600 hover:text-gray-800">Ga Door Naar Event</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
