/**
 * components/landing/how-it-works.tsx
 * AANGEPAST OM DE OUDE LAYOUT TE EVENAREN.
 */
'use client';

import { Gift, Share2, Heart, Users, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import IntroVideo from './intro-video'; // We gebruiken de nieuwe IntroVideo

// Data voor de feature secties (typo gecorrigeerd)
const featureSections = [
    {
    id: 'profiles',
    icon: Users,
    title: 'Profielen beheren',
    imageUrl:
      'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fimages%2FProfileSwitcher.svg?alt=media&token=d8479670-e18e-4143-9691-b6f7b7a24f7a',
    alt: 'Illustratie van het wisselen tussen gebruikersprofielen op Wish2Share',
    points: [
      'Creëer eerst jouw eigen profiel',
      'Maak in jouw profiel, profielen voor je kinderen, huisdieren, ...',
      'Geef de profielen een naam en foto',
      'Wissel handig tussen verschillende profielen',
      'Laat meerdere personen een profiel beheren',
    ],
  },
  {
    id: 'wishlists',
    icon: Gift,
    title: 'WishLists maken',
    imageUrl:
      'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fimages%2FCreateWishlist.svg?alt=media&token=675dcc74-0ab2-4476-a676-2111d60af4ec',
    alt: 'Illustratie van het aanmaken van een wishlist op Wish2Share',
    points: [
      'Kies voor wie je een Wishlist wil maken',
      'Voeg je favorieten items toe',
      'Deel de WishList met anderen of koppel de WishList aan een event',
      'Iedereen behalve de eigenaar ziet wanneer een item wordt afgevinkt',
    ],
  },
  {
    id: 'events',
    icon: CalendarPlus,
    title: 'Evenementen Organiseren',
    imageUrl:
      'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fimages%2FCreateEvent.svg?alt=media&token=108ec19d-c59c-421c-b8fc-6215620c',
    alt: 'Illustratie van het organiseren van een evenement op Wish2Share',
    points: [
      'Stel de datum, locatie en budget in',
      'Kies of je namen (lootjes) wil trekken of niet',
      'Voeg deelnemers toe door een link te sturen',
      'Link bestaande WishLists aan het Event',
      'Gebruik de chat en voorbereidings-tools om alles te organiseren',
    ],
  },
  {
    id: 'following',
    icon: Share2,
    title: 'Vrienden Volgen',
    imageUrl:
      'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fimages%2FFollowFriends.svg?alt=media&token=16a3dcb1-e208-44f1-bbd3-733aa37a6729',
    alt: 'Illustratie van het volgen van vrienden op Wish2Share',
    points: [
      'Zoek vrienden via de knop "Zoek Vrienden"',
      'Kies of je een persoon of een WishList wil volgen',
      'Stuur een uitnodiging als je de persoon niet vindt',
      'Beheer jouw volgers en wie jij volgt in je dashboard',
    ],
  },
];

export default function HowItWorks() {
  return (
    <div className="bg-white py-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Introductie */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Hoe werkt Wish2Share?
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Drie simpele stappen naar grote gelukjes
          </p>
        </div>

        <div className="mt-6 flex w-full flex-col items-center gap-4 md:gap-20 lg:flex-row-reverse">
          {/* Video Sectie */}
          <div className="w-full">
            <IntroVideo />
          </div>

          {/* Stappen Sectie */}
          <div className="mt-8 w-full md:mt-0 lg:mt-0">
            <div className="grid grid-cols-1 gap-10 xs:grid-cols-3 xs:gap-y-10 lg:grid-cols-1">
              <Step icon={Gift} title="Maak een event of wishlist" description="Start door het maken van een persoonlijk event of wishlist." />
              <Step icon={Share2} title="Deel met familie en vrienden" description="Nodig anderen uit om deel te nemen aan jouw event of om jouw Wishlist te zien." />
              <Step icon={Heart} title="Ontvang jouw gelukjes" description="Geniet van het geven en krijgen van kleine en grote gelukjes" />
            </div>
          </div>
        </div>

        {/* Feature Gidsen */}
        <div className="mt-32 space-y-24 px-4 sm:mb-3 sm:px-6 lg:px-10">
          {featureSections.map((feature, index) => (
            <FeatureSection
              key={feature.id}
              {...feature}
              imageFirst={index % 2 !== 0} // Wisselt de afbeelding van kant
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Sub-component voor de stappen
const Step = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string; }) => (
  <div className="flex flex-col items-center gap-2 text-center lg:flex-row lg:gap-20">
    <div className="flex justify-center">
      <div className="relative">
        <div className="absolute -inset-2">
          <div className="mx-auto h-full w-full rotate-6 bg-warm-olive opacity-20 blur-lg"></div>
        </div>
        <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-warm-olive text-white sm:h-16 sm:w-16">
          <Icon className="h-5 w-5 sm:h-8 sm:w-8" />
        </div>
      </div>
    </div>
    <div>
      <h3 className="text-md font-semibold text-gray-900 sm:text-xl">{title}</h3>
      <p className="max-w-80 text-xs text-gray-600 sm:text-sm">{description}</p>
    </div>
  </div>
);

// Sub-component voor de feature sections
const FeatureSection = ({ id, icon: Icon, title, imageUrl, alt, points, imageFirst }: (typeof featureSections)[0] & { imageFirst: boolean }) => (
  <section id={id} className="scroll-mt-16">
    <div className="grid grid-cols-1 items-center gap-16 sm:grid-cols-2">
      <div className={`relative ${imageFirst ? 'lg:order-1' : 'lg:order-2'}`}>
        <Image
          src={imageUrl}
          alt={alt}
          width={500}
          height={400}
          className="rounded-xl shadow-xl transition-all duration-300 hover:scale-105"
        />
      </div>
      <div className={`${imageFirst ? 'lg:order-2' : 'lg:order-1'}`}>
        <div className="mb-6 flex items-center space-x-4">
          <div className="rounded-xl bg-warm-olive p-4 text-white shadow-lg">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-3xl font-semibold text-gray-800">{title}</h3>
        </div>
        <ol className="list-inside list-decimal space-y-3 pl-6 text-gray-600">
          {points.map(point => <li key={point}>{point}</li>)}
        </ol>
        <div className="ml-6 mt-4">
          <Link href="/user-guide" className="text-warm-olive hover:underline">
            Meer info
          </Link>
        </div>
      </div>
    </div>
  </section>
);