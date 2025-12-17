// src/components/layout/footer.tsx
import { getSocialMediaAccounts } from '@/lib/server/data/social-media';
import { FooterClient } from './footer-client';

export async function Footer() {
  const account = await getSocialMediaAccounts();
  
  return <FooterClient socialAccounts={account} />;
}