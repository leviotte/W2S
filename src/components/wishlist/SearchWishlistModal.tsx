// src/components/ShareWishlistModal.tsx
"use client";

import React, { useState } from "react";
import { X, Mail, Copy } from "lucide-react";
import { toast } from "sonner";

interface ShareWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientFirstName: string;
}

export default function ShareWishlistModal({
  isOpen,
  onClose,
  recipientName,
  recipientFirstName,
}: ShareWishlistModalProps) {
  const [senderInfo, setSenderInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  if (!isOpen) return null;

  // SSR-safe URL
  const createWishlistUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/create-wishlist`
      : "/create-wishlist";

  const shareMessage = `Hello ${recipientFirstName},

${senderInfo.firstName} ${senderInfo.lastName} would like to know what your wish list is to buy you a gift.
You can easily create your own list via this link and be surprised!

${createWishlistUrl}

Best regards,

${senderInfo.firstName} & The Wish2Share Team`;

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailShare = () => {
    if (!validateEmail(senderInfo.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    const mailtoLink = `mailto:?subject=Create your wishlist on Wish2Share!&body=${encodeURIComponent(
      shareMessage
    )}`;
    window.location.href = mailtoLink;
    onClose();
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      shareMessage
    )}`;
    window.open(whatsappUrl, "_blank");
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareMessage);
    toast.success("Message copied to clipboard", {
      onClose: () => {
        toast.info("You can now send the link", { autoClose: 3000 });
      },
    });
    onClose();
  };

  const shareOptions = [
    { icon: <Mail className="h-8 w-8 text-gray-600" />, label: "E-mail", action: handleEmailShare },
    {
      icon: (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
          className="h-8 w-8"
        />
      ),
      label: "WhatsApp",
      action: handleWhatsAppShare,
    },
    { icon: <Copy className="h-8 w-8 text-gray-600" />, label: "Copy", action: handleCopyLink },
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Vraag WishList
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form Inputs */}
            <div className="space-y-6">
              {["firstName", "lastName", "email"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700">
                    {field === "firstName"
                      ? "Jouw Voornaam *"
                      : field === "lastName"
                      ? "Jouw Achternaam *"
                      : "Jouw E-mailadres"}
                  </label>

                  {field === "email" && (
                    <p className="text-sm text-gray-500 mb-2">
                      If you enter your email address here, we will
                      automatically notify you when {recipientFirstName} has
                      created a wish list.
                    </p>
                  )}

                  <input
                    type={field === "email" ? "email" : "text"}
                    value={senderInfo[field as keyof typeof senderInfo]}
                    onChange={(e) =>
                      setSenderInfo({
                        ...senderInfo,
                        [field]: e.target.value,
                      })
                    }
                    className={`mt-1 block w-full rounded-md border-2 shadow-sm focus:ring-warm-olive ${
                      field === "email" &&
                      senderInfo.email &&
                      !validateEmail(senderInfo.email)
                        ? "border-red-500"
                        : "border-gray-300 focus:border-warm-olive"
                    }`}
                    placeholder={field === "email" ? "example@email.com" : ""}
                    required={field !== "email"}
                  />
                </div>
              ))}

              {/* Share Options */}
              {senderInfo.firstName && senderInfo.lastName && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Verstuur via:
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    {shareOptions.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={option.action}
                        className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50"
                        aria-label={`Share via ${option.label}`}
                      >
                        {option.icon}
                        <span className="text-sm text-gray-600">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Sluit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
