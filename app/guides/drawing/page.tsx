// app/guides/drawing/page.tsx
import Image from "next/image";
import {
  Gift,
  Users,
  Calendar,
  Mail,
} from "lucide-react";

const steps = [
  {
    id: 1,
    icon: Calendar,
    title: "Stap 1: Plan het evenement",
    description:
      "Kies een datum voor je cadeauruil en bepaal een budget per persoon. Zo houdt iedereen het eerlijk én overzichtelijk.",
    image:
      "https://images.unsplash.com/photo-1513128034602-7814ccaddd4e?w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    icon: Users,
    title: "Stap 2: Nodig deelnemers uit",
    description:
      "Voeg alle deelnemers toe en verstuur de uitnodigingen. Iedereen krijgt zijn persoonlijke link om zich aan te melden.",
    image:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    icon: Gift,
    title: "Stap 3: Trek de lootjes",
    description:
      "Wanneer iedereen bevestigd heeft, kun je de trekking starten. Het systeem voorkomt dubbele combinaties en zelftrekking automatisch.",
    image:
      "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    icon: Mail,
    title: "Stap 4: Ontvang je lootje",
    description:
      "Elke deelnemer krijgt automatisch een e-mail met zijn getrokken persoon. Inclusief toegang tot de bijhorende wishlist.",
    image:
      "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=1200&auto=format&fit=crop",
  },
];

export default function DrawingGuidePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-center text-4xl font-bold text-gray-900 mb-16">
        Hoe werkt de lootjes-trekking?
      </h1>

      <div className="space-y-24">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <section
              key={step.id}
              className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${
                index % 2 !== 0 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className={index % 2 !== 0 ? "md:order-2" : ""}>
                <div className="flex items-center gap-4 mb-4">
                  <Icon className="h-12 w-12 text-amber-500" />
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {step.title}
                  </h2>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className={index % 2 !== 0 ? "md:order-1" : ""}>
                <div className="relative w-full h-72 md:h-80 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
