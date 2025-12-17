// src/app/guides/subscription/page.tsx
import Image from "next/image";
import { Search, Bell, Settings, Mail } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: Search,
    title: "Stap 1: Vind wishlists",
    description:
      "Zoek naar de wishlists van vrienden en familie. Gebruik naam of een gedeelde link om direct naar de juiste lijst te gaan.",
    image:
      "https://images.unsplash.com/photo-1461280360983-bd93eaa5051b?w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    icon: Bell,
    title: "Stap 2: Meld je aan",
    description:
      "Klik op 'Volgen' op de wishlist. Je kunt meerdere lijsten tegelijk volgen om op de hoogte te blijven van updates.",
    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    icon: Settings,
    title: "Stap 3: Stel voorkeuren in",
    description:
      "Kies hoe je meldingen wilt ontvangen: e-mail, push of beide, zodat je geen enkele update mist.",
    image:
      "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    icon: Mail,
    title: "Stap 4: Blijf op de hoogte",
    description:
      "Ontvang automatisch updates wanneer items worden toegevoegd of gewijzigd, zodat je altijd op de hoogte bent van de wishlist.",
    image:
      "https://images.unsplash.com/photo-1526554850534-7c78330d5f90?w=1200&auto=format&fit=crop",
  },
];

export default function SubscriptionGuidePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-center text-4xl font-bold text-gray-900 mb-16">
        Hoe je je kunt inschrijven op verlanglijsten?
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
