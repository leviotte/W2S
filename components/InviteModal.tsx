// app/components/InviteModal.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";
import RequiredFieldMarker from "./RequiredFieldMarker";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
}

interface SenderInfo {
  firstName: string;
  lastName: string;
  email: string;
}

export default function InviteModal({ isOpen, onClose, recipientEmail }: InviteModalProps) {
  const [senderInfo, setSenderInfo] = useState<SenderInfo>({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!senderInfo.firstName || !senderInfo.lastName || !senderInfo.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSending(true);

    try {
      await emailjs.send(
        "YOUR_SERVICE_ID",
        "YOUR_TEMPLATE_ID",
        {
          to_email: recipientEmail,
          from_name: `${senderInfo.firstName} ${senderInfo.lastName}`,
          from_email: senderInfo.email,
          message: `${senderInfo.firstName} is looking for a gift for you! Create your wishlist here:`,
          website_url: window.location.origin,
        },
        "YOUR_PUBLIC_KEY"
      );

      toast.success("Invitation sent!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while sending the invitation");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl z-10">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Send Invitation</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {["firstName", "lastName", "email"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700">
                    {field === "email"
                      ? "Your Email Address"
                      : field === "firstName"
                      ? "First Name"
                      : "Last Name"}
                    <RequiredFieldMarker />
                  </label>
                  <input
                    type={field === "email" ? "email" : "text"}
                    required
                    value={senderInfo[field as keyof SenderInfo]}
                    onChange={(e) =>
                      setSenderInfo({ ...senderInfo, [field]: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              ))}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSending ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
