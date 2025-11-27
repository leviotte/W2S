import Image from 'next/image';
import Link from 'next/link';
import { Gift, Share2, Heart, Users, CalendarPlus } from 'lucide-react';
import { IntroVideo } from './IntroVideo'; // GEWIJZIGDE IMPORT
import { cn } from '@/lib/utils';

const simpleSteps = [
  {
    icon: <Gift className="h-7 w-7 sm:h-8 sm:w-8" />,
    title: 'Maak een event of wishlist',
    description: 'Start door het maken van een persoonlijk event of wishlist.',
  },
  {
    icon: <Share2 className="h-7 w-7 sm:h-8 sm:w-8" />,
    title: 'Deel met vrienden',
    description: 'Nodig anderen uit om deel te nemen of jouw wishlist te zien.',
  },
  {
    icon: <Heart className="h-7 w-7 sm:h-8 sm:w-8" />,
    title: 'Ontvang jouw gelukjes',
    description: 'Geniet van het geven en krijgen van kleine en grote gelukjes.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="w-full py-20 md:py-24 lg:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Introductie & Video */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl md:text-5xl">
            Hoe werkt Wish2Share?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            Drie simpele stappen naar grote gelukjes
          </p>
        </div>

        <div className="mt-12 grid items-center gap-12 lg:mt-20 lg:grid-cols-2 lg:gap-20">
          <div className="lg:order-last">
            <IntroVideo /> {/* GEWIJZIGDE COMPONENTNAAM */}
          </div>
          <div className="flex flex-col gap-8">
            {simpleSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-6">
                <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <div className="absolute -inset-2 animate-pulse rounded-full bg-primary/20 blur-lg"></div>
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-1 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Guides */}
        <div className="mt-24 space-y-24 lg:mt-32">
          <FeatureGuide
            id="profiles"
            icon={<Users className="h-6 w-6" />}
            title="Profielen beheren"
            imageUrl="https://firebasestorage.googleapis.com/v0/b/wish2share4u.appspot.com/o/public%2Fimages%2FProfileSwitcher.svg?alt=media&token=d8479670-e18e-4143-9691-b6f7b7a24f7a"
            imageAlt="User Profiles"
            features={[
              'Creëer eerst jouw eigen profiel',
              'Maak in jouw profiel, profielen voor je kinderen, huisdieren, ...',
              'Geef de profielen een naam en foto',
              'Wissel handig tussen verschillende profielen',
              'Laat meerdere personen een profiel beheren',
            ]}
            link="/user-guide#profiles"
            imageLeft={false}
          />
          <FeatureGuide
            id="wishlists"
            icon={<CalendarPlus className="h-6 w-6" />}
            title="WishLists maken"
            imageUrl="https://firebasestorage.googleapis.com/v0/b/wish2share4u.appspot.com/o/public%2Fimages%2FCreateWishlist.svg?alt=media&token=675dcc74-0ab2-4476-a676-2111d60af4ec"
            imageAlt="Creating WishList"
            features={[
              'Kies voor wie je een Wishlist wil maken',
              'Voeg je favorieten items toe',
              'Deel de WishList of koppel ze aan een event',
              'Iedereen (behalve de eigenaar) ziet wat is afgevinkt',
            ]}
            link="/user-guide#wishlists"
            imageLeft={true}
          />
          {/* Voeg hier de andere twee feature guides toe op dezelfde manier */}
        </div>
      </div>
    </section>
  );
}

// Sub-component voor een consistente layout
function FeatureGuide({
  id,
  icon,
  title,
  imageUrl,
  imageAlt,
  features,
  link,
  imageLeft,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  imageUrl: string;
  imageAlt: string;
  features: string[];
  link: string;
  imageLeft: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className={cn('flex flex-col', imageLeft ? 'md:order-first' : 'md:order-last')}>
            <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                {icon}
                </div>
                <h3 className="text-3xl font-semibold">{title}</h3>
            </div>
            <ul className="list-disc space-y-3 pl-10 text-muted-foreground">
                {features.map((feature) => (
                <li key={feature}>{feature}</li>
                ))}
            </ul>
            <Link
                href={link}
                className="mt-6 inline-block font-semibold text-primary hover:underline"
            >
                Meer info &rarr;
            </Link>
        </div>
        <div className="relative h-64 md:h-full">
            <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="rounded-xl object-contain shadow-xl transition-transform duration-300 hover:scale-105"
            />
        </div>
      </div>
    </section>
  );
}