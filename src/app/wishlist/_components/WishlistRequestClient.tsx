// src/app/wishlist/_components/WishlistRequestClient.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { Event, EventParticipant } from '@/types/event';

interface WishlistRequestClientProps {
  event: Event;
  participant: EventParticipant;
  currentUser: any;
  type: 'invitation' | 'drawn' | 'wishlist' | 'crossOff';
}

export default function WishlistRequestClient({
  event,
  participant,
  currentUser,
  type,
}: WishlistRequestClientProps) {
  const router = useRouter();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [invitationText, setInvitationText] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ✅ Generate invitation text (EXACT zoals oude versie)
  useEffect(() => {
    if (!event || !currentUser) return;

    const firstName = participant?.firstName || 'vriend';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    // Event link (same logic as old code)
    const eventLink = !event.allowSelfRegistration
      ? `${origin}/event/participation/${event.id}`
      : `${origin}/event/self-register/${event.id}`;

    let text = '';
    let subject = '';

    switch (type) {
      case 'invitation':
        text = `Hallo ${firstName},
We missen nog iemand… Oh ja, jou!
Je hebt het event gevonden, maar je bent nog niet officieel aangemeld. Meld je nu aan om op de hoogte te blijven, wensen te delen en samen iets moois van dit moment te maken.

Klik hier om aan te melden: ${eventLink}

Feestelijke groetjes,

Het Wish2Share-Team`;
        subject = `${currentUser?.firstName} nodigt je uit voor het event: ${event?.name}`;
        break;

      case 'drawn':
        text = `Hallo ${firstName},
Het lijkt erop dat iemand nog geen naam getrokken heeft… Oh ja, jij!
Je zit al bij het event, maar je hebt nog geen naam getrokken. Spannend! Klik hieronder om jouw lootje te trekken en het cadeaufestijn op gang te brengen. Laat het verrassen (en verrast worden) maar beginnen!

Klik hier om een lootje te trekken: ${eventLink}

Feestelijke groetjes,

Het Wish2Share-Team`;
        subject = `${currentUser?.firstName} herinnert je eraan om een lootje te trekken voor ${event?.name}`;
        break;

      case 'wishlist':
        text = `Hallo ${firstName},
We missen nog een wishlist.. Oh ja, die van jou!
Je bent aangemeld voor het event, maar je wishlist ontbreekt nog. Laat anderen weten waar je blij van wordt (of wat je echt niet nog een keer wil krijgen). Voeg je wensen toe en help iedereen cadeaustress voorkomen!

Maak hier je wishlist aan: ${eventLink}

Feestelijke groetjes,

Het Wish2Share-Team`;
        subject = `${currentUser?.firstName} vraagt je wishlist voor ${event?.name}`;
        break;

      case 'crossOff':
        text = `Hallo ${firstName},
Je lootje wacht nog op z'n cadeauheld (ja, jij dus)
Check de wishlist, koop iets leuks en vink het af zodra je het koopt. Zo voorkomen we dat ze straks 3 keer hetzelfde uitpakken.
Geen zorgen, de eigenaar van de wishlist ziet niet wat je afvinkt ;).
Gratis tip: Sinterklaas komt ook niet last minute! Wacht niet tot de pakjespaniek toeslaat.

Bekijk de wishlist hier: ${eventLink}

Feestelijke groetjes

Het Wish2Share-Team`;
        subject = `${currentUser?.firstName} vraagt je om af te vinken wat je al kocht voor ${event?.name}`;
        break;

      default:
        text = `Hallo ${firstName},

Ik zou graag willen weten wat je leuk vindt, zodat ik je een cadeau kan kopen! Zou je een wishlist willen maken? Dan kan ik je verrassen!

Je kan hier je wishlist maken: ${origin}/dashboard/create-wishlist?tab=wishlists&subTab=create

Bekijk het event hier: ${eventLink}

Met vriendelijke groet, ... Oeps! Ik had bijna mijn naam geschreven! :D`;
        subject = `${currentUser?.firstName} vraagt je om een wishlist te maken voor ${event?.name}`;
        break;
    }

    setInvitationText(text);
    setEmailSubject(subject);
  }, [event, participant, currentUser, type]);

  const handleSendInvite = async () => {
    const email = participant?.email || recipientEmail;
    if (!email) {
      toast.error('Voer een geldig e-mailadres in.');
      return;
    }

    setIsSending(true);
    try {
      // ✅ Open mailto (EXACT zoals oude versie)
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(invitationText)}`;
      
      window.location.href = mailtoLink;

      // ✅ Redirect back to event
      setTimeout(() => {
        router.push(`/dashboard/event/${event.id}?tab=events&subTab=details`);
      }, 500);
    } catch (error) {
      toast.error(
        'Oeps! Er is geen uitnodiging verstuurd! Vraag de organisator om een herinnering te sturen. ;D'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 my-[20px] bg-gray-100 rounded-xl shadow-xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-100 rounded-xl shadow-sm p-6"
      >
        {/* ✅ Title (EXACT zoals productie) */}
        <h1 className="text-2xl font-bold text-accent mb-6">
          Vraag een wishlist aan
        </h1>

        {/* ✅ Description */}
        <div className="mb-8">
          {participant?.email ? (
            <p className="text-accent">
              {participant?.firstName} Heeft nog geen verlanglijst aangemaakt,
              maar goed nieuws! Klik op 'Uitnodigen' en wij doen de rest zonder
              je identiteit te onthullen!
            </p>
          ) : (
            <p className="text-accent">
              {participant?.firstName} Heeft zich nog niet geregistreerd, maar
              goed nieuws! Vul hier hun e-mailadres in, en wij doen de rest
              zonder je identiteit te onthullen!
            </p>
          )}
        </div>

        {/* ✅ Email Input (als participant geen email heeft) */}
        {!participant?.email && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-accent mb-2">
              Email Adres
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full rounded-md border-none border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive p-2"
              placeholder="naam@voorbeeld.be"
              required
            />
          </div>
        )}

        {/* ✅ Invitation Text Textarea (EXACT zoals productie) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-accent mb-2">
            Uitnodigingstekst
          </label>
          <textarea
            value={invitationText}
            onChange={(e) => setInvitationText(e.target.value)}
            className="w-full h-48 rounded-md border-none text-accent border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive p-2"
            placeholder="Schrijf hier je uitnodiging..."
          />
        </div>

        {/* ✅ Buttons (EXACT zoals productie) */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() =>
              router.push(`/dashboard/event/${event.id}?tab=events&subTab=details`)
            }
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Terug naar Evenement
          </button>
          <button
            onClick={handleSendInvite}
            disabled={isSending || (!participant?.email && !recipientEmail)}
            className="px-6 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Invite'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}