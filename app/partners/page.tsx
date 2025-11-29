import Image from "next/image";

const partners = [
  {
    name: "Bol",
    logo:
      "https://cdn.freebiesupply.com/logos/large/2x/bol-com-1-logo-png-transparent.png",
  },
  {
    name: "Amazon",
    logo:
      "https://static.vecteezy.com/system/resources/previews/019/766/240/non_2x/amazon-logo-amazon-icon-transparent-free-png.png",
  },
  {
    name: "Douglas",
    logo:
      "https://douglas.group/fileadmin/04_Newsroom/01_Media-Library/01_Logos/DOUGLAS/DOUGLAS_LOGO_L_RGB_black.png",
  },
  {
    name: "Travelbags",
    logo: "https://jouw.nl/wp-content/uploads/2019/08/travelbags-blauw.png",
  },
  {
    name: "Ebay",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/48/EBay_logo.png",
  },
];

export default function PartnerInfoPage() {
  return (
    <div className="px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold mb-4">
          Informatie over onze partners
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Onze partners worden zorgvuldig geselecteerd op betrouwbaarheid,
          kwaliteit, snelle levering en de beste prijzen. Zo garanderen we de
          beste ervaring voor onze klanten.
        </p>
      </div>

      <div className="flex flex-wrap gap-10 sm:px-10 md:px-32 justify-center md:gap-20">
        {partners.map((partner) => (
          <div
            key={partner.name}
            className="flex justify-center items-center w-fit"
          >
            <Image
              src={partner.logo}
              alt={partner.name}
              width={200}
              height={100}
              className="object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
