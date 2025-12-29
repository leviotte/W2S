// src/app/wishlist/_components/WishlistRequestDialog.tsx
"use client";

import { useCallback, useMemo } from "react";
import { X, Mail, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Zet hier de type-defs uit je codebase! (importeer indien centraal)
type DialogContext =
  | {
      type: "event";
      event: {
        id: string;
        name: string;
      };
      participant: {
        id: string; 
        firstName: string;
        lastName: string;
        email?: string;
      };
    }
  | {
      type: "search";
      recipient: {
        firstName: string;
        lastName: string;
        email?: string;
      };
    };

interface WishlistRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  context: DialogContext;
}

export default function WishlistRequestDialog({
  isOpen,
  onClose,
  context,
}: WishlistRequestDialogProps) {
  // --- Dynamisch bericht ---
  const { bericht, email, mailTo, whatsappLink } = useMemo(() => {
    let bericht = "";
    let email = "";
    if (context.type === "event") {
      const { event, participant } = context;
      email = participant.email ?? "";
      bericht = `👋 Hey ${participant.firstName},

Zin om deel te nemen aan het event "${event.name}" op Wish2Share?

Maak eenvoudig gratis je wishlist aan zodat je verrast kan worden!
➡️ ${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/wishlists/create/${event.id}/${participant.id}

Tot snel op het event!
De Wish2Share-crew`;
    } else {
      // search/no result
      const { recipient } = context;
      email = recipient.email ?? "";
      bericht = `Hey ${recipient.firstName},

Maak ook een gratis wishlist bij Wish2Share! Zo kunnen vrienden/familie je écht verrassen.

Direct je lijst aanmaken: ${typeof window !== "undefined" ? window.location.origin : ""}/create-wishlist

Groetjes!
De Wish2Share-community`;
    }
    return {
      bericht,
      email,
      mailTo: email
        ? `mailto:${email}?subject=Maak je wishlist aan op Wish2Share!&body=${encodeURIComponent(
            bericht
          )}`
        : undefined,
      whatsappLink: `https://wa.me/?text=${encodeURIComponent(bericht)}`,
    };
  }, [context]);

  // --- Actions ---
  const handleEmail = useCallback(() => {
    if (!mailTo) {
      toast.error("Geen e-mailadres beschikbaar.");
      return;
    }
    window.location.href = mailTo;
    onClose();
  }, [mailTo, onClose]);

  const handleWhatsApp = useCallback(() => {
    window.open(whatsappLink, "_blank");
    onClose();
  }, [whatsappLink, onClose]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(bericht);
    toast.success("Bericht gekopieerd naar klembord!");
    onClose();
  }, [bericht, onClose]);

  // --- UI ---
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full max-w-md rounded-lg bg-white shadow-2xl"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {context.type === "event"
                      ? "Nodig uit voor event & verlanglijst"
                      : "Persoon uitnodigen tot wishlist"}
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {/* Beschrijving/intro */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {context.type === "event"
                    ? `Deze persoon heeft nog geen wishlist voor het event. Verstuur een uitnodiging:`
                    : `Deze persoon bestaat nog niet op Wish2Share. Je kan nu zelf een uitnodiging sturen!`}
                </p>
                <div className="mb-4 bg-slate-50 border rounded p-3 text-[15px] select-all text-gray-800 whitespace-pre-line">
                  {bericht}
                </div>
                {/* Delen-knoppen */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <button
                    type="button"
                    onClick={handleEmail}
                    disabled={!email}
                    className="flex flex-col items-center p-4 rounded-lg hover:bg-warm-beige transition disabled:opacity-40"
                  >
                    <Mail className="h-7 w-7 text-gray-600 mb-1" />
                    <span className="text-xs text-gray-700">E-mail</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="flex flex-col items-center p-4 rounded-lg hover:bg-warm-beige transition"
                  >
                    <MessageCircle className="h-7 w-7 text-green-600 mb-1" />
                    <span className="text-xs text-gray-700">WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex flex-col items-center p-4 rounded-lg hover:bg-warm-beige transition"
                  >
                    <Copy className="h-7 w-7 text-gray-600 mb-1" />
                    <span className="text-xs text-gray-700">Kopieer</span>
                  </button>
                </div>
                <div className="flex justify-end mt-7">
                  <button
                    onClick={onClose}
                    className="px-5 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Sluiten
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}