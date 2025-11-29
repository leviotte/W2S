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
 * Deterministically generate a pseudonym for a user in a specific event
 * @param userId - The user ID
 * @param eventId - The event ID
 * @returns A pseudonym string
 */
export const getPseudonymForUser = (userId: string, eventId: string): string => {
  const combinedString = userId + eventId;
  let hash = 0;
  
  for (let i = 0; i < combinedString.length; i++) {
    const char = combinedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Ensure 32-bit integer
  }

  const index = Math.abs(hash) % pseudonyms.length;
  return pseudonyms[index];
};
