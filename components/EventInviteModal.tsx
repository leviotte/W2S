"use client";

import { useState, useCallback, useMemo } from "react";
import { X, Mail, Copy } from "lucide-react";
import { toast } from "react-toastify";
import { useModal } from "../hooks/useModal";
import { motion, AnimatePresence } from "framer-motion";

interface EventInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
  eventName: string;
  organizerFirstName: string;
  participant: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  registrationDeadline?: string;
  eventUrl: string;
}

export default function EventInviteModal({
  isOpen,
  onClose,
  onAfterClose,
  eventName,
  organizerFirstName,
  participant,
  registrationDeadline,
  eventUrl,
}: EventInviteModalProps) {
  const { handleOverlayClick } = useModal({ onClose, onAfterClose });

  const [recipientEmail, setRecipientEmail] = useState(
    participant.email || ""
  );

  if (!isOpen) return null;

  const formattedDeadline = useMemo(() => {
    if (!registrationDeadline) return "";
    return new Date(registrationDeadline).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [registrationDeadline]);

  const messageBody = useMemo(() => {
    return (
      `Hey,\n\n` +
      `You are now part of the group ${eventName}!\n\n` +
      `Time to spread the festive joy and surprise each other.\n\n` +
      `Quickly head to our group page to create your wish list and draw a name.\n\n` +
      `Use this link to easily see who you're buying a gift for:\n${eventUrl}\n\n` +
      `With festive greetings!\n\n` +
      `The ${eventName} Team` +
      (registrationDeadline
        ? `\n\nRegistration ends on: ${formattedDeadline}`
        : "")
    );
  }, [eventName, eventUrl, registrationDeadline, formattedDeadline]);

  const emailSubject = useMemo(
    () => `${organizerFirstName} invites you to ${eventName}`,
    [organizerFirstName, eventName]
  );

  const validateEmail = useCallback((email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const handleEmailShare = useCallback(() => {
    if (!validateEmail(recipientEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(messageBody)}`;

    window.location.href = mailtoLink;
    onClose();
  }, [recipientEmail, validateEmail, emailSubject, messageBody, onClose]);

  const handleWhatsAppShare = useCallback(() => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      messageBody
    )}`;
    window.open(whatsappUrl, "_blank");
    onClose();
  }, [messageBody, onClose]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(messageBody);
    toast.success("Message copied to clipboard", {
      onClose: () => {
        toast.info("You can now send the link", { autoClose: 3000 });
      },
    });
    onClose();
  }, [messageBody, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-modal="true"
          role="dialog"
          onClick={handleOverlayClick}
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.28 }}
              className="relative w-full max-w-md rounded-lg bg-white shadow-xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Send Invitation
                  </h2>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Recipient's Email Address
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 focus:border-warm-olive focus:ring-warm-olive"
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Send via:
                    </h3>

                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={handleEmailShare}
                        className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50"
                      >
                        <Mail className="h-8 w-8 text-gray-600" />
                        <span className="text-sm text-gray-600">Email</span>
                      </button>

                      <button
                        onClick={handleWhatsAppShare}
                        className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50"
                      >
                        <img
                          src="/whatsapp.svg"
                          alt="WhatsApp"
                          className="h-8 w-8"
                        />
                        <span className="text-sm text-gray-600">WhatsApp</span>
                      </button>

                      <button
                        onClick={handleCopyLink}
                        className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50"
                      >
                        <Copy className="h-8 w-8 text-gray-600" />
                        <span className="text-sm text-gray-600">Copy</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
