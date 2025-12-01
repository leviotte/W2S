// lib/config/env.ts
const config = {
  aws: {
    accessKey: process.env.AWS_ACCESS_KEY || "",
    secretKey: process.env.AWS_SECRET_KEY || "",
    partnerTag: process.env.AWS_PARTNER_TAG || "",
    host: "webservices.amazon.com",
    region: "us-east-1",
  },
};

export default config;
