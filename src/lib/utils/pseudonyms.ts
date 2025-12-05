/**
 * src/lib/utils/pseudonyms.ts
 *
 * Bevat een lijst van pseudoniemen en een deterministische functie om er een te genereren.
 *
 * VERBETERINGEN:
 * - Functienaam verduidelijkt naar `getPseudonym`.
 * - Robuuste guard clause toegevoegd die de 'string | undefined' error oplost door een fallback te voorzien.
 *   Dit garandeert dat de functie altijd een string teruggeeft, zelfs als de array leeg zou zijn.
 */

export const pseudonyms: string[] = [
  "Blije Bij", "Dansende Dolfijn", "Giechelende Geit", "Knuffelige Koala", "Lachende Lama",
  "Schattige Sneeuwuil", "Vrolijke Vos", "Grappige Giraffe", "Fluisterende Fret", "Kusbare Kat",
  "Zwervende Zebra", "Springende Spin", "Trotse Tijger", "Speelse Slang", "Zingend Zeepaardje",
  "Dolle Draak", "Koddige Koekoek", "Zotte Zwaan", "Scheve Schildpad", "Brullende Baviaan",
  "Kusbare Kaketoe", "Schattige Sabeltand", "Grommende Grizzly", "Springende Salamander",
  "Pratende Panda", "Fluisterende Flamingo", "Knuffelige Kangoeroe", "Snurkende Slang",
  "Kwetsbare Kiwi", "Swingende Sneeuwuil", "Giechelende Gnoe", "Knuffelige Knabbelaar",
  "Sexy Stokstaart", "Zingende Zeekoe", "Fladderende Flamingo", "Rondfladderende Rotsduif",
  "Flitsende Fret", "Lachende Lynx", "Zotte Zebra", "Vrolijke Vleermuis", "Dansende Dingo",
  "Giechelende Gans", "Knabbelende Kater", "Lachend Lieveheersbeestje", "Vrolijke Vis",
  "Blije Big", "Grijnzende Gekko", "Fladderende Fazant", "Zotte Zeehond", "Trotse Toekan",
  "Dolle Duif", "Koddige Kreeft", "Schattig Stekelvarken", "Brullende Bever", "Kale Kolibrie",
  "Schattig Schaapje", "Grappige Gorilla", "Wolkige Walrus", "Springende Stekelbaars",
  "Fluisterende Fazant", "Knuffelige Koekoek", "Snurkende Schildpad", "Kusbare Kameel",
  "Swingende Slak", "Giechelende Gazelle", "Buitelende Bonobo", "Sexy Schorpioen",
  "Zingende Zebra", "Flitsende Flamingo", "Zotte Zwaardvis", "Vrolijke Vink"
];

/**
 * Genereert op een deterministische manier een pseudoniem voor een gebruiker binnen een specifiek event.
 * @param userId - De ID van de gebruiker.
 * @param eventId - De ID van het event.
 * @returns Een pseudoniem als string.
 */
export const getPseudonym = (userId: string, eventId: string): string => {
  // Guard Clause: Vangt de edge case af waar de lijst leeg zou zijn.
  if (pseudonyms.length === 0) {
    return "Anonieme Aap";
  }

  const combinedString = userId + eventId;
  let hash = 0;
  
  for (let i = 0; i < combinedString.length; i++) {
    const char = combinedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Zorgt ervoor dat het een 32-bit integer blijft.
  }

  const index = Math.abs(hash) % pseudonyms.length;
  
  // Door de guard clause hierboven weet TypeScript nu dat pseudonyms[index] nooit undefined kan zijn.
  // We kunnen voor de zekerheid nog een fallback toevoegen, wat de meest robuuste oplossing is.
  return pseudonyms[index] || "Vrolijke Vriend";
};