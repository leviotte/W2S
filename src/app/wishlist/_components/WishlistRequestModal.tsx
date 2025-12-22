// src/components/wishlist/WishlistRequestModal.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";

interface WishlistRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
}

export default function WishlistRequestModal({ isOpen, onClose, recipientEmail }: WishlistRequestModalProps) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const sendMail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email) {
      toast.error("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          to_email: recipientEmail,
          from_name: `${form.firstName} ${form.lastName}`,
          from_email: form.email,
          message: `${form.firstName}, discover your surprises! Create your Wish2Share list:` ,
          website_url: typeof window !== "undefined" ? window.location.origin : ""
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      toast.success("Invitation sent.");
      onClose();
    } catch (err) {
      toast.error("Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-full transition"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Send Invitation</h2>

          <form onSubmit={sendMail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">First name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Last name *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Your email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send invitation"}
              </button>
            </div>
          </form>
                </div>
      </div>
    </div>
  );
}
