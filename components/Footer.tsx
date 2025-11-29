// app/components/Footer.tsx
"use client";

import { useEffect, useState } from "react";
import { Facebook, Instagram } from "lucide-react";
import { FaPinterest, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function Footer() {
  const [account, setAccount] = useState<{ id: string; [key: string]: any } | null>(null);
  const { currentUser } = useStore();

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const accountsCollectionRef = collection(db, "accounts");
        const querySnapshot = await getDocs(query(accountsCollectionRef));

        if (!querySnapshot.empty) {
          const accountDoc = querySnapshot.docs[0];
          setAccount({ id: accountDoc.id, ...accountDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching account:", error);
      }
    };

    fetchAccount();
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between md:flex-row gap-6">
          {/* Logo and Socials */}
          <div className="mx-auto md:mx-0 w-full flex justify-center items-center pr-4">
            <div className="relative text-center">
              <Link href="/" onClick={scrollToTop} className="flex items-center justify-center">
                <img
                  src="/wish2share.png"
                  alt="Wish2Share Logo"
                  className="h-16 md:h-28 pb-4 md:mx-2"
                />
                <span className="ml-2 text-xl md:text-4xl font-bold text-accent">Wish2Share</span>
              </Link>

              {account && (account.instagram || account.facebook || account.twitter || account.tiktok || account.pinterest) && (
                <h4 className="text-lg text-center font-semibold text-accent mb-4">
                  Volg ons via
                </h4>
              )}

              {account && (
                <div className="flex justify-center space-x-4 mt-4">
                  {account.instagram && (
                    <a href={`//${account.instagram}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-gray-900">
                      <Instagram className="h-6 w-6" />
                    </a>
                  )}
                  {account.facebook && (
                    <a href={`//${account.facebook}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-gray-900">
                      <Facebook className="h-6 w-6" />
                    </a>
                  )}
                  {account.twitter && (
                    <a href={`//${account.twitter}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-gray-900">
                      <FaXTwitter className="h-6 w-6" />
                    </a>
                  )}
                  {account.tiktok && (
                    <a href={`//${account.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-gray-900">
                      <FaTiktok className="h-6 w-6" />
                    </a>
                  )}
                  {account.pinterest && (
                    <a href={`//${account.pinterest}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-gray-900">
                      <FaPinterest className="h-6 w-6" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mx-auto md:mx-0 w-full md:w-auto">
            <h4 className="text-lg font-semibold text-accent mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-accent hover:text-gray-900" onClick={scrollToTop}>Home</Link>
              </li>
              <li>
                <Link href="/blog" className="text-accent hover:text-gray-900" onClick={scrollToTop}>Blog Inspiratie</Link>
              </li>
              <li>
                <Link href="/help" className="text-accent hover:text-gray-900">Help</Link>
              </li>
              <li>
                <Link href="/search" className="text-accent hover:text-gray-900" onClick={scrollToTop}>Zoek Vrienden</Link>
              </li>
            </ul>
          </div>

          {/* Information Links */}
          <div className="mx-auto md:mx-0 w-full md:w-auto">
            <h4 className="text-lg font-semibold text-accent mb-4">Informatie</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms-and-conditions" className="text-accent hover:text-gray-900" onClick={scrollToTop}>Algemene Voorwaarden</Link>
              </li>
              <li>
                <Link href="/user-guide" className="text-accent hover:text-gray-900" onClick={scrollToTop}>Hoe werkt Wish2Share?</Link>
              </li>
              <li>
                <Link href="/about-us" className="text-accent hover:text-gray-900" onClick={scrollToTop}>Over ons</Link>
              </li>
              <li>
                <Link href="/help" className="text-accent hover:text-gray-900" onClick={scrollToTop}>Help</Link>
              </li>
            </ul>
          </div>

          {/* Partners */}
          <div className="mx-auto md:mx-10 w-full md:w-auto">
            <h4 className="text-lg font-semibold text-accent mb-4">Onze Partners</h4>
            <div className="flex flex-col items-center space-y-4">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fpartners%2FBOLPNG.png?alt=media&token=be6a6683-5cfa-4325-9023-8f7e318ba1f7"
                alt="Bol.com"
                className="h-16 w-auto hover:cursor-pointer"
                onClick={() =>
                  window.open("https://partner.bol.com/click/click?p=2&t=url&s=1410335&f=TXL&url=https%3A%2F%2Fwww.bol.com%2Fbe%2Fnl%2F&name=De%2520winkel%2520van%2520ons%2520allemaal%2520", "_blank")
                }
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"
                alt="Amazon"
                className="h-16 w-auto hover:cursor-pointer"
                onClick={() => window.open("https://amzn.to/3EzuqpO", "_blank")}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 text-center text-sm text-accent">
          © {new Date().getFullYear()} Wish2Share. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
