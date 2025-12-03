import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import ShareWishlistModal from "./SearchWishlistModal";

interface WishlistInviteHandlerProps {
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientEmail?: string;
}

export default function WishlistInviteHandler({
  recipientFirstName = "",
  recipientLastName = "",
  recipientEmail = "",
}: WishlistInviteHandlerProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  const fullRecipientName = (() => {
    const first = recipientFirstName.trim();
    const last = recipientLastName.trim();
    if (first && last) return `${first} ${last}`;
    if (first) return first;
    return "this person";
  })();

  return (
    <div className="text-center py-8">
      <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />

      <p className="text-gray-600 mb-4">
        Couldn't find who you’re looking for? Invite them using the button below.
      </p>

      <button
        onClick={() => setShowShareModal(true)}
        className="inline-flex items-center px-4 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive transition-colors"
      >
        <UserPlus className="h-5 w-5 mr-2" />
        Invite Person
      </button>

      {showShareModal && (
        <ShareWishlistModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          recipientName={fullRecipientName}
          recipientFirstName={recipientFirstName || "this person"}
          recipientEmail={recipientEmail || ""}
        />
      )}
    </div>
  );
}
