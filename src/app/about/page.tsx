// app/about/page.tsx
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-6xl mx-auto">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-lime-900 mb-4">Ons verhaal</h1>
        <p className="text-gray-600 leading-relaxed mb-4">
          <strong>Welkom bij Wish2Share</strong> – Het platform voor het perfecte cadeau
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Bij <strong>Wish2Share</strong> draait alles om het vinden en delen van het ideale cadeau voor elke gelegenheid. Of het nu gaat om verjaardagen, feestdagen of speciale gebeurtenissen, wij maken het makkelijker dan ooit om cadeaus te delen en wensen te beheren.
        </p>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Wat maakt Wish2Share uniek?</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Met <strong>Wish2Share</strong> kun je eenvoudig je verlangens en cadeaulijsten beheren en delen. Geen gedoe meer met ingewikkelde lijstjes of verwarrende verlangens.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li><strong>Eenvoudig cadeaubeheer:</strong> Voeg eenvoudig je wensen toe, deel ze met anderen en laat hen het perfecte cadeau kiezen.</li>
          <li><strong>Gebruiksvriendelijke interface:</strong> Ons platform is intuïtief en snel te gebruiken.</li>
          <li><strong>Verlanglijst delen:</strong> Deel je lijst met vrienden en familie zonder gedoe.</li>
          <li><strong>De kracht van geven:</strong> Geef met vertrouwen, wetende dat jouw cadeau altijd goed aankomt.</li>
        </ul>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Onze missie</h2>
        <p className="text-gray-600 leading-relaxed mb-2">
          Wij geloven in de kracht van geven en ontvangen. Ons doel is het cadeauproces eenvoudig en plezierig te maken.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Maak het geven van een cadeau makkelijk – met Wish2Share.
        </p>
      </section>

      <section className="mb-16 flex justify-center">
        <div className="relative w-full max-w-4xl h-80 rounded-lg overflow-hidden shadow-lg">
          <Image
            src="https://ktfcu.org/wp-content/uploads/2023/03/Christmas-800x566-1.png"
            alt="Gifting Made Easy"
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Onze Waarden</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-8">
          <li><strong>Persoonlijkheid:</strong> Cadeaus met een persoonlijke touch die de band weerspiegelt tussen gever en ontvanger.</li>
          <li><strong>Gemak:</strong> Het proces van lijst maken tot delen wordt naadloos en eenvoudig.</li>
          <li><strong>Innovatie:</strong> Continu verbeteren en nieuwe functies toevoegen om gebruikers te ondersteunen.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Wat We Doen</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Bij Wish2Share kun je eenvoudig verlanglijstjes maken en beheren. Deel je lijsten met geliefden zodat zij precies weten wat jouw wensen zijn.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Waarom Kiezen Voor Ons?</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li><strong>Gebruikersvriendelijk:</strong> Intuïtieve interface voor eenvoudig beheer.</li>
          <li><strong>Veiligheid en Privacy:</strong> Jouw gegevens zijn veilig en beschermd.</li>
          <li><strong>Diversiteit aan Opties:</strong> Breed scala aan cadeau-opties voor elke smaak en budget.</li>
        </ul>

        <p className="text-gray-700 leading-relaxed mb-2">
          Bij Wish2Share geloven we dat geven en ontvangen van cadeaus een magische ervaring moet zijn. Begin vandaag nog met het creëren en delen van jouw verlanglijstjes!
        </p>

        <p className="text-gray-700 leading-relaxed mb-2">Feestelijke groetjes!</p>
        <p className="text-gray-700 leading-relaxed font-semibold">Het Wish2Share-Team</p>
      </section>
    </main>
  );
}
