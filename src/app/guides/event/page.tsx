// src/app/guides/event/page.tsx
import Image from "next/image";
import { Gift, Users, Settings, CalendarPlus } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: CalendarPlus,
    title: "Stap 1: Maak het evenement aan",
    description:
      "Begin met het aanmaken van een nieuw evenement. Kies een duidelijke naam en stel datum en tijd in.",
    image:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    icon: Settings,
    title: "Stap 2: Stel de details in",
    description:
      "Stel het budget per persoon in en bepaal de regels voor de cadeauruil, zodat alles duidelijk is voor iedereen.",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    icon: Users,
    title: "Stap 3: Beheer de deelnemers",
    description:
      "Voeg deelnemers toe, volg wie zich heeft aangemeld en bewerk eenvoudig deelnemers wanneer nodig.",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    icon: Gift,
    title: "Stap 4: Start de pakjes verdeling",
    description:
      "Wanneer alle deelnemers aangemeld zijn, kun je de lootjes trekken. Het systeem informeert automatisch iedereen en verdeelt eerlijk.",
    image:
      "https://images.unsplash.com/photo-1545987796-200677ee1011?w=1200&auto=format&fit=crop",
  },
];

export default function EventGuidePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-center text-4xl font-bold text-gray-900 mb-16">
        Een evenement organiseren?
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
