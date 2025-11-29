import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient>;

if (!redisClient) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });
  redisClient.connect().catch(console.error);
  console.log("✅ Redis connected");
}

export default redisClient;
