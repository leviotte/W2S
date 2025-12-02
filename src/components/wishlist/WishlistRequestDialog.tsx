"use client";

import { useCallback, useMemo } from "react";
import { X, Mail, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface WishlistRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  participant: {
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export default function WishlistRequestDialog({
  isOpen,
  onClose,
  participant,
}: WishlistRequestDialogProps) {
  const baseMessage = useMemo(
    () =>
      `Hello ${participant.firstName},

Would you like to create a wishlist so I can pick out a nice gift for you?

You can create your wishlist here: ${typeof window !== "undefined" ? window.location.origin : ""}/create-wishlist`,
    [participant.firstName]
  );

  const handleEmailShare = useCallback(() => {
    if (!participant.email) {
      toast.error("No email address available");
      return;
    }

    const mailto = `mailto:${participant.email}?subject=Wishlist Request&body=${encodeURIComponent(
      baseMessage
    )}`;

    window.location.href = mailto;
    onClose();
  }, [participant.email, baseMessage, onClose]);

  const handleWhatsAppShare = useCallback(() => {
    const url = `https://wa.me/?text=${encodeURIComponent(baseMessage)}`;
    window.open(url, "_blank");
    onClose();
  }, [baseMessage, onClose]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(baseMessage);
    toast.success("Message copied to clipboard");
    onClose();
  }, [baseMessage, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black"
              onClick={onClose}
            />

            {/* Dialog */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md rounded-lg bg-white shadow-2xl"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Request Wishlist
                  </h2>

                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {participant.email
                    ? "This person doesn't have a wishlist yet. Click 'invite' and we will take care of the rest!"
                    : "This person is not registered yet. Enter their email address, click 'invite', and we will take care of the rest!"}
                </p>

                {/* Buttons */}
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={handleEmailShare}
                    disabled={!participant.email}
                    className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
                  >
                    <Mail className="h-8 w-8 text-gray-600 mb-2" />
                    <span className="text-sm text-gray-600">E-mail</span>
                  </button>

                  <button
                    onClick={handleWhatsAppShare}
                    className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition"
                  >
                    <MessageCircle className="h-8 w-8 text-gray-600 mb-2" />
                    <span className="text-sm text-gray-600">WhatsApp</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Copy className="h-8 w-8 text-gray-600 mb-2" />
                    <span className="text-sm text-gray-600">Copy</span>
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
