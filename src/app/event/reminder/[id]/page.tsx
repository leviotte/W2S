"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mail, Copy } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store/use-auth-store";
import InviteMethodCard from "@/components/invites/InviteMethodCard";

const EventReminderPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { events, currentUser, updateEvent } = useStore();
  const [isInvited, setIsInvited] = useState(false);

  const event = events.find((e) => e.id === id);

  useEffect(() => {
    if (!event || !currentUser) {
      router.push("/dashboard");
    }
  }, [event, currentUser, router]);

  useEffect(() => {
    if (isInvited && id) {
      const markInvited = async () => {
        await updateEvent(id, { isInvited: true });
      };
      markInvited();
    }
  }, [isInvited, id, updateEvent]);

  if (!event || !currentUser) {
    return null;
  }

  const emailSubject = `${currentUser.firstName} Nodigt je uit voor ${event.name}`;
  const messageBody = `Hallo,

Je maakt nu deel uit van de groep ${event.name}!

Tijd om de feestelijke sfeer te verspreiden en elkaar te verrassen.

Ga snel naar onze groepspagina om je verlanglijst aan te maken en een naam te trekken.

Met deze link kun je eenvoudig zien voor wie je een cadeau moet kopen:
${window.location.origin}/event/participation/${event.id}

Met feestelijke groeten,

Het ${event.name} Team${
    event.registrationDeadline
      ? `

De registratie is open tot: ${new Date(
          event.registrationDeadline
        ).toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`
      : ""
  }`;

  const handleEmailShare = () => {
    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(messageBody)}`;
    window.location.href = mailtoLink;
    setIsInvited(true);
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      messageBody
    )}`;
    window.open(whatsappUrl, "_blank");
    setIsInvited(true);
    toast.success("Uitnodigingslink gedeeld op WhatsApp!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      window.location.origin + "/event/participation/" + event.id
    );
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verstuur uitnodiging
          </h1>
          <p className="text-gray-600">Nodig deelnemers uit voor {event.name}</p>
        </div>

        {!isInvited ? (
          <div className="mt-8 space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Deel de uitnodiging met de deelnemers
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InviteMethodCard icon={Mail} title="Email" onClick={handleEmailShare} />
              <InviteMethodCard
                icon="whatsapp"
                title="WhatsApp"
                onClick={handleWhatsAppShare}
              />
              <InviteMethodCard
                icon={Copy}
                title="Kopieer Link"
                onClick={handleCopyLink}
              />
            </div>

            <div className="flex justify-center pt-6 border-t">
              <button
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-800"
              >
                Sla over
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-green-600 font-bold mt-4 text-center">
              Uitnodigingen zijn verstuurd!
            </p>
            <div className="flex justify-center pt-6">
              <button
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-800"
              >
                Ga Door Naar Event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventReminderPage;
