/**
 * components/landing/how-it-works.tsx
 *
 * GEMIGREERD & GEOPTIMALISEERD
 * - Omgezet naar een Server Component (geen 'use client') voor maximale performance.
 * - Alle <img> tags vervangen door de geoptimaliseerde <Image> component van Next.js.
 * - <Link> componenten gebruiken nu de Next.js 'href' prop.
 * - De interactieve video is een apart component 'IntroVideo' (wordt een Client Component).
 */
import { Gift, Share2, Heart, Users, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import IntroVideo from './intro-video';

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
    imageFirst: false,
  },
  {
    id: 'wishlists',
    icon: CalendarPlus, // Dit icoon past beter bij 'maken'
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
    imageFirst: true,
  },
  {
    id: 'events',
    icon: Users,
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
    imageFirst: false,
  },
  {
    id: 'following',
    icon: Share2, // Passender icoon voor 'volgen'
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
    imageFirst: true,
  },
];

export default function HowItWorks() {
  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Introductie */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Hoe werkt Wish2Share?
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Drie simpele stappen naar grote gelukjes
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-12 lg:flex-row-reverse items-center w-full">
          {/* Video Sectie */}
          <div className="w-full lg:w-1/2">
            <IntroVideo />
          </div>

          {/* Stappen Sectie */}
          <div className="w-full lg:w-1/2">
            <div className="flex flex-col gap-8">
              <Step icon={Gift} title="Maak een event of wishlist" description="Start door het maken van een persoonlijk event of een gedetailleerde wishlist." />
              <Step icon={Share2} title="Deel met familie en vrienden" description="Nodig anderen uit om deel te nemen aan jouw event of om jouw wishlist te zien." />
              <Step icon={Heart} title="Ontvang en geef gelukjes" description="Geniet van het geven en krijgen van de perfecte kleine en grote geschenken." />
            </div>
          </div>
        </div>

        {/* Feature Gidsen */}
        <div className="mt-24 space-y-24">
          {featureSections.map((feature, index) => (
            <FeatureSection
              key={feature.id}
              {...feature}
              imageFirst={index % 2 !== 0} // Zorgt voor de afwisseling
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Sub-component voor de stappen, houdt de JSX clean
const Step = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string; }) => (
  <div className="flex items-center gap-6">
    <div className="relative flex-shrink-0">
      <div className="absolute -inset-2.5">
        <div className="w-20 h-20 mx-auto rotate-6 bg-warm-olive/20 blur-lg"></div>
      </div>
      <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-full bg-warm-olive text-white">
        <Icon className="w-8 h-8" />
      </div>
    </div>
    <div className="text-left">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-gray-600">{description}</p>
    </div>
  </div>
);

// Sub-component voor de feature sections, houdt de JSX clean
const FeatureSection = ({ id, icon: Icon, title, imageUrl, alt, points, imageFirst }: (typeof featureSections)[0]) => (
  <section id={id} className="scroll-mt-20">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      <div className={`relative ${imageFirst ? 'md:order-2' : 'md:order-1'}`}>
        {/* NEXT.JS IMAGE OPTIMIZATION! */}
        <Image
          src={imageUrl}
          alt={alt}
          width={500}
          height={400}
          className="rounded-xl shadow-xl w-full h-auto"
        />
      </div>
      <div className={`${imageFirst ? 'md:order-1' : 'md:order-2'}`}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-4 bg-warm-olive rounded-xl text-white shadow-lg">
            <Icon className="w-7 h-7" />
          </div>
          <h3 className="text-3xl font-semibold text-gray-800">{title}</h3>
        </div>
        <ol className="list-decimal list-inside space-y-3 pl-2 text-gray-600 text-lg">
          {points.map(point => <li key={point}>{point}</li>)}
        </ol>
        <div className="mt-6">
          <Link href="/user-guide" className="text-warm-olive font-semibold hover:underline">
            Meer info &raquo;
          </Link>
        </div>
      </div>
    </div>
  </section>
);