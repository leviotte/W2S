// functions/src/index.ts
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { PaapiClient, PaapiRequest } from "amazon-pa-api5-node-ts";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// ---------------------- Amazon PAAPI client ----------------------
const amazonClient = new PaapiClient({
  accessKey: process.env.AMAZON_ACCESS_KEY!,
  secretKey: process.env.AMAZON_SECRET_KEY!,
  partnerTag: process.env.AMAZON_ASSOCIATE_TAG!,
  region: "us-east-1",
});

// ---------------------- Delete unverified users older than 3 days ----------------------
export const deleteUnverifiedAccounts = onSchedule("every 24 hours", async () => {
  const threeDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));

  try {
    const snapshot = await db
      .collection("users")
      .where("emailVerified", "==", false)
      .where("createdAt", "<", threeDaysAgo)
      .get();

    const deletionPromises = snapshot.docs.map(async (doc) => {
      await auth.deleteUser(doc.id);
      await db.collection("users").doc(doc.id).delete();
      console.log(`Deleted unverified user: ${doc.id}`);
    });

    await Promise.all(deletionPromises);
    console.log(`Successfully deleted ${snapshot.docs.length} unverified users.`);
  } catch (err) {
    console.error("Error deleting unverified accounts:", err);
  }
});

// ---------------------- Cleanup old messages older than 30 days ----------------------
export const cleanupOldMessages = onSchedule("every 24 hours", async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const snapshot = await db.collection("events").get();
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    const messages: any[] = doc.data()?.messages || [];
    const filtered = messages.filter((msg) => new Date(msg.timestamp) > thirtyDaysAgo);

    if (filtered.length !== messages.length) {
      batch.update(doc.ref, { messages: filtered });
    }
  });

  await batch.commit();
});

// ---------------------- Update last read timestamps on event change ----------------------
export const updateLastRead = onDocumentWritten("events/{eventId}", async (event) => {
  const change = event.data;
  if (!change) return;

  const newData = change.after?.data() || {};
  const prevData = change.before?.data() || {};

  if (newData.messages?.length !== prevData.messages?.length) {
    const updatedTimestamps = {
      ...newData.lastReadTimestamps,
      [newData.organizer]: Date.now(),
    };
    await change.after?.ref.update({ lastReadTimestamps: updatedTimestamps });
    console.log(`Updated lastReadTimestamps for event: ${event.params.eventId}`);
  }
});

// ---------------------- Amazon product search using new client ----------------------
export const searchAmazonProducts = onSchedule("every 24 hours", async () => {
  const request: PaapiRequest = {
    Keywords: "laptop",
    SearchIndex: "All",
    Resources: [
      "ItemInfo.Title",
      "Offers.Listings.Price",
      "ItemInfo.ByLineInfo",
      "Images.Primary.Large",
      "DetailPageURL",
    ],
  };

  try {
    const response = await amazonClient.searchItems(request);
    const items = response.ItemsResult?.Items || [];

    if (items.length > 0) {
      const batch = db.batch();

      items.forEach((item) => {
        const productRef = db.collection("amazon_products").doc(item.ASIN);

        batch.set(productRef, {
          title: item.ItemInfo?.Title?.DisplayValue || "",
          price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || "",
          url: item.DetailPageURL || "",
          image: item.Images?.Primary?.Large?.URL || "",
        });
      });

      await batch.commit();
      console.log(`Saved ${items.length} Amazon products to Firestore.`);
    }
  } catch (err) {
    console.error("Error fetching Amazon products:", err);
  }
});
