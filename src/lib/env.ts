import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = [
  "AWS_ACCESS_KEY_WISH",
  "AWS_SECRET_KEY_WISH",
  "AWS_PARTNER_TAG",
  "BOL_API_CLIENT_ID",
  "BOL_API_CLIENT_SECRET",
  "AWS_REGION",
  "AWS_MARKETPLACE",
  "AWS_HOST",
  "REDIS_URL",
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

export default {
  aws: {
    accessKey: process.env.AWS_ACCESS_KEY_WISH!,
    secretKey: process.env.AWS_SECRET_KEY_WISH!,
    partnerTag: process.env.AWS_PARTNER_TAG!,
    region: process.env.AWS_REGION!,
    marketplace: process.env.AWS_MARKETPLACE!,
    host: process.env.AWS_HOST!,
  },
  bol: {
    clientId: process.env.BOL_API_CLIENT_ID!,
    clientSecret: process.env.BOL_API_CLIENT_SECRET!,
  },
  redis: {
    url: process.env.REDIS_URL!,
  },
};
