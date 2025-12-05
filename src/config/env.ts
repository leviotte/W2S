// De "Gold Standard" versie
import { z } from 'zod';

const envSchema = z.object({
  aws: z.object({
    accessKey: z.string().min(1, 'AWS Access Key is vereist'), // Faalt als het ontbreekt
    secretKey: z.string().min(1, 'AWS Secret Key is vereist'), // Faalt als het ontbreekt
    partnerTag: z.string().min(1, 'AWS Partner Tag is vereist'), // Faalt als het ontbreekt
    host: z.string().default('webservices.amazon.nl'), // Flexibel met een default
    region: z.string().default('eu-west-1'), // Flexibel met een default
  }),
});

const config = envSchema.parse({
  aws: {
    // Let op: Ik gebruik de officiële namen van de AWS variabelen
    accessKey: process.env.AWS_ACCESS_KEY_ID, 
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    partnerTag: process.env.AWS_PARTNER_TAG,
    host: process.env.AWS_PAAPI_HOST, // Kan overschreven worden
    region: process.env.AWS_PAAPI_REGION, // Kan overschreven worden
  },
});

export default config;