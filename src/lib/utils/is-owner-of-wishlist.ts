export interface OwnershipCheckArgs {
  wishlist: {
    ownerId: string;
    profileId?: string | null;
  };
  sessionUserId: string;
  activeProfileId: string | null;
}

/**
 * Bepaal of de huidige gebruiker OWNER is van een wishlist (main of profiel)
 * + Voeg logging toe voor directe debug-inzicht!
 */
export function isOwnerOfWishlist({
  wishlist,
  sessionUserId,
  activeProfileId,
}: OwnershipCheckArgs): boolean {
  const debugPrefix = '[isOwnerOfWishlist]';
  console.log(`${debugPrefix} ====== DEBUG ======`);
  console.log(`${debugPrefix} wishlist:`, wishlist ? JSON.stringify(wishlist) : wishlist);
  console.log(`${debugPrefix} sessionUserId:`, sessionUserId, typeof sessionUserId);
  console.log(`${debugPrefix} activeProfileId:`, activeProfileId, typeof activeProfileId);

  if (!wishlist) {
    console.warn(`${debugPrefix} Geen wishlist-object meegegeven`);
    return false;
  }

  // MAIN PROFILE: tolerant voor null, undefined, lege string
  if (!activeProfileId || activeProfileId === 'main-account') {
    const profileIdCheck = [null, undefined, ''].includes(wishlist.profileId);
    const ownerCheck = wishlist.ownerId === sessionUserId;
    console.log(`${debugPrefix} Main-account check:`);
    console.log(`${debugPrefix} > profileIdCheck ([null, undefined, ''].includes(profileId)):`, profileIdCheck, '(profileId:', wishlist.profileId, ')');
    console.log(`${debugPrefix} > ownerCheck (wishlist.ownerId === sessionUserId):`, ownerCheck, '(ownerId:', wishlist.ownerId, '| sessionUserId:', sessionUserId, ')');
    return ownerCheck && profileIdCheck;
  }

  // SUB-PROFIEL: moet exacte match zijn
  const subProfileCheck = wishlist.profileId === activeProfileId;
  console.log(`${debugPrefix} Sub-profiel check:`);
  console.log(`${debugPrefix} > wishlist.profileId === activeProfileId:`, subProfileCheck, '(wishlist.profileId:', wishlist.profileId, '| activeProfileId:', activeProfileId, ')');
  return subProfileCheck;
}