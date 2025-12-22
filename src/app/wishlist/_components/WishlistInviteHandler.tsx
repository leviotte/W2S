'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ShareWishlistModal from './ShareWishlistModal';

export function WishlistInviteHandler() {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [recipientData, setRecipientData] = useState({
    name: '',
    firstName: '',
    email: '',
  });

  useEffect(() => {
    const invite = searchParams.get('invite');
    const name = searchParams.get('name');
    const firstName = searchParams.get('firstName');
    const email = searchParams.get('email'); // ✅ Added email param

    if (invite === 'true' && name && firstName) {
      setRecipientData({
        name,
        firstName,
        email: email || '', // ✅ Extract email from URL
      });
      setIsOpen(true);
    }
  }, [searchParams]);

  return (
    <ShareWishlistModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      recipientName={recipientData.name}
      recipientFirstName={recipientData.firstName}
      recipientEmail={recipientData.email} // ✅ FIX: Pass email prop
    />
  );
}