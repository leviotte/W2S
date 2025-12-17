// src/components/layout/footer-client.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { SocialMediaAccounts } from '@/types';
import { FaPinterest, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

interface FooterClientProps {
  socialAccounts: SocialMediaAccounts | null;
}

export function FooterClient({ socialAccounts }: FooterClientProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between md:flex-row gap-6">
          
          {/* Logo and Social */}
          <div className="mx-auto md:mx-0 w-full flex justify-center items-center pr-4">
            <div className="relative text-center">
              <Link 
                href="/" 
                className="flex items-center justify-center" 
                onClick={scrollToTop}
              >
                <Image
                  src="/wish2share.png"
                  alt="Wish2Share Logo"
                  width={112}
                  height={112}
                  className="h-16 md:h-28 pb-4 md:mx-2"
                  priority
                />
                <span className="ml-2 text-xl md:text-4xl font-bold text-warm-olive">
                  Wish2Share
                </span>
              </Link>
              
              {socialAccounts && (
                socialAccounts.instagram || 
                socialAccounts.facebook || 
                socialAccounts.twitter || 
                socialAccounts.tiktok || 
                socialAccounts.pinterest
              ) && (
                <>
                  <h4 className="text-lg text-center font-semibold text-warm-olive mb-4">
                    Volg ons via
                  </h4>
                  <div className="flex justify-center space-x-4 mt-4">
                    {socialAccounts.instagram && (
                      <a 
                        href={`//${socialAccounts.instagram}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-warm-olive hover:text-gray-900"
                        aria-label="Instagram"
                      >
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                      </a>
                    )}
                    {socialAccounts.facebook && (
                      <a 
                        href={`//${socialAccounts.facebook}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-warm-olive hover:text-gray-900"
                        aria-label="Facebook"
                      >
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                      </a>
                    )}
                    {socialAccounts.twitter && (
                      <a 
                        href={`//${socialAccounts.twitter}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-warm-olive hover:text-gray-900"
                        aria-label="Twitter/X"
                      >
                        <FaXTwitter className="h-6 w-6" />
                      </a>
                    )}
                    {socialAccounts.tiktok && (
                      <a 
                        href={`//${socialAccounts.tiktok}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-warm-olive hover:text-gray-900"
                        aria-label="TikTok"
                      >
                        <FaTiktok className="h-6 w-6" />
                      </a>
                    )}
                    {socialAccounts.pinterest && (
                      <a 
                        href={`//${socialAccounts.pinterest}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-warm-olive hover:text-gray-900"
                        aria-label="Pinterest"
                      >
                        <FaPinterest className="h-6 w-6" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mx-auto md:mx-0 w-full md:w-auto">
            <h4 className="text-lg font-semibold text-warm-olive mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-warm-olive hover:text-gray-900" onClick={scrollToTop}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-warm-olive hover:text-gray-900" onClick={scrollToTop}>
                  Blog Inspiratie
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-warm-olive hover:text-gray-900" onClick={scrollToTop}>
                  Gidsen
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-warm-olive hover:text-gray-900" onClick={scrollToTop}>
                  Zoek Vrienden
                </Link>
              </li>
            </ul>
          </div>

          {/* Information Links */}
          <div className="mx-auto md:mx-0 w-full md:w-auto">
            <h4 className="text-lg font-semibold text-warm-olive mb-4">Informatie</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms-and-conditions" className="text-warm-olive hover:text-gray-900" onClick={scrollToTop}>
                  Algemene Voorwaarden
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-warm-olive hover:text-gray-900" onClick={scrollToTop}>
                  Hoe werkt Wish2Share?
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-warm-olive hover:text-gray-900" onClick={scrollToTop}>
                  Over ons
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-warm-olive hover:text-gray-900" onClick={scrollToTop}>
                  Partners
                </Link>
              </li>
            </ul>
          </div>

          {/* Partners Section */}
          <div className="mx-auto md:mx-10 w-full md:w-auto">
            <h4 className="text-lg font-semibold text-warm-olive mb-4">Onze Partners</h4>
            <div className="flex flex-col items-center space-y-4">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fpartners%2FBOLPNG.png?alt=media&token=be6a6683-5cfa-4325-9023-8f7e318ba1f7"
                alt="Bol.com"
                width={128}
                height={64}
                className="h-16 w-auto hover:cursor-pointer"
                onClick={() => window.open("https://partner.bol.com/click/click?p=2&t=url&s=1410335&f=TXL&url=https%3A%2F%2Fwww.bol.com%2Fbe%2Fnl%2F&name=De%2520winkel%2520van%2520ons%2520allemaal%2520", "_blank")}
              />
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"
                alt="Amazon"
                width={128}
                height={64}
                className="h-16 w-auto hover:cursor-pointer"
                onClick={() => window.open("https://amzn.to/3EzuqpO", "_blank")}
              />
            </div>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-warm-olive">
          © {new Date().getFullYear()} Wish2Share. All rights reserved.
        </div>
      </div>
    </footer>
  );
}