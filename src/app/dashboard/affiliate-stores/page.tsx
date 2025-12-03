"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "@/lib/client/firebase";
import { db } from "@/lib/client/firebase";

export default function AffiliateStoresPage() {
  const [stats, setStats] = useState({
    stores: 0,
    bolItems: 0,
    amazonItems: 0,
    bolClicks: 0,
    amazonClicks: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const wishlistsCollection = collection(db, "wishlists");
        const wishlistsSnapshot = await getDocs(wishlistsCollection);

        let bolItemsCount = 0;
        let amazonItemsCount = 0;

        wishlistsSnapshot.forEach((doc) => {
          const wishlist = doc.data();
          if (wishlist.items && Array.isArray(wishlist.items)) {
            wishlist.items.forEach((item) => {
              if (item.source === "BOL") bolItemsCount++;
              if (item.source === "AMZ") amazonItemsCount++;
            });
          }
        });

        const clicksCollection = collection(db, "clicks");
        const bolClicksQuery = query(clicksCollection, where("source", "==", "BOL"));
        const amazonClicksQuery = query(clicksCollection, where("source", "==", "AMZ"));

        const bolClicksSnapshot = await getDocs(bolClicksQuery);
        const amazonClicksSnapshot = await getDocs(amazonClicksQuery);

        setStats({
          stores: 2,
          bolItems: bolItemsCount,
          amazonItems: amazonItemsCount,
          bolClicks: bolClicksSnapshot.size,
          amazonClicks: amazonClicksSnapshot.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#606c38] mb-2">
          Affiliate Stores Stats
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { title: "Stores", value: stats.stores },
          { title: "Bol Items", value: stats.bolItems },
          { title: "Amazon Items", value: stats.amazonItems },
          { title: "Bol Clicks", value: stats.bolClicks },
          { title: "Amazon Clicks", value: stats.amazonClicks },
        ].map((stat) => (
          <div
            key={stat.title}
            className="bg-gray-50 p-6 rounded-lg shadow-sm flex flex-col items-center justify-center"
          >
            <h2 className="text-xl text-gray-800 font-medium mb-4">{stat.title}</h2>
            <p className="text-5xl font-bold text-[#606c38]">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
