import { memo } from "react";
import { X, Mail, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type DialogContext =
  | { type: "event"; event: { id: string; name: string }; participant: { id: string; firstName: string; lastName: string; email?: string } }
  | { type: "search"; recipient: { firstName: string; lastName: string; email?: string } };

interface WishlistRequestDialogServerProps {
  participant: EventParticipant;
  event: Event;
}

export default function WishlistRequestDialogServer({ isOpen, onClose, context }: WishlistRequestDialogServerProps) {
  const bericht = (() => {
    if (context.type === "event") {
      const { event, participant } = context;
      return `👋 Hey ${participant.firstName},\n\nZin om deel te nemen aan het event "${event.name}"?\n➡️ ${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/wishlists/create/${event.id}/${participant.id}\n\nTot snel!`;
    } else {
      const { recipient } = context;
      return `Hey ${recipient.firstName},\n\nMaak ook een gratis wishlist aan: ${typeof window !== "undefined" ? window.location.origin : ""}/create-wishlist`;
    }
  })();

  const email = context.type === "event" ? context.participant.email : context.type === "search" ? context.recipient.email : undefined;
  const mailTo = email ? `mailto:${email}?subject=Maak je wishlist aan&body=${encodeURIComponent(bericht)}` : undefined;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(bericht)}`;

  const handleEmail = () => {
    if (!mailTo) return toast.error("Geen e-mailadres beschikbaar.");
    window.location.href = mailTo;
    onClose();
  };

  const handleWhatsApp = () => {
    window.open(whatsappLink, "_blank");
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(bericht);
    toast.success("Bericht gekopieerd!");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 bg-black/40">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="relative w-full max-w-md rounded-lg bg-white shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{context.type === "event" ? "Nodig uit voor event & wishlist" : "Persoon uitnodigen tot wishlist"}</h2>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">{context.type === "event" ? "Deze persoon heeft nog geen wishlist. Verstuur een uitnodiging:" : "Deze persoon bestaat nog niet. Je kan een uitnodiging sturen!"}</p>
                <div className="mb-4 bg-slate-50 border rounded p-3 text-[15px] select-all text-gray-800 whitespace-pre-line">{bericht}</div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <button type="button" onClick={handleEmail} disabled={!email} className="flex flex-col items-center p-4 rounded-lg hover:bg-warm-beige transition disabled:opacity-40"><Mail className="h-7 w-7 text-gray-600 mb-1" /><span className="text-xs text-gray-700">E-mail</span></button>
                  <button type="button" onClick={handleWhatsApp} className="flex flex-col items-center p-4 rounded-lg hover:bg-warm-beige transition"><MessageCircle className="h-7 w-7 text-green-600 mb-1" /><span className="text-xs text-gray-700">WhatsApp</span></button>
                  <button type="button" onClick={handleCopy} className="flex flex-col items-center p-4 rounded-lg hover:bg-warm-beige transition"><Copy className="h-7 w-7 text-gray-600 mb-1" /><span className="text-xs text-gray-700">Kopieer</span></button>
                </div>
                <div className="flex justify-end mt-7">
                  <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded hover:bg-gray-200">Sluiten</button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
