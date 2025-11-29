"use client";

import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { collection, getCountFromServer, getDocs, DocumentData } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Statistics {
  totalUsers: number;
  totalEvents: number;
  totalWishlists: number;
  wishlistUserPercentage: number;
  eventUserPercentage: number;
}

export default function Metrics() {
  const [statistics, setStatistics] = useState<Statistics>({
    totalUsers: 0,
    totalEvents: 0,
    totalWishlists: 0,
    wishlistUserPercentage: 0,
    eventUserPercentage: 0,
  });
  const [monthlyUsers, setMonthlyUsers] = useState<number[]>([]);
  const [monthlyWishlists, setMonthlyWishlists] = useState<number[]>([]);
  const [cumulativeUsers, setCumulativeUsers] = useState<number[]>([]);
  const [cumulativeWishlists, setCumulativeWishlists] = useState<number[]>([]);
  const [cumulativeEvents, setCumulativeEvents] = useState<number[]>([]);
  const [monthLabels, setMonthLabels] = useState<string[]>([]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Laatste 12 maanden labels
        const labels = Array.from({ length: 12 }, (_, i) => {
          const monthIndex = (currentMonth - 11 + i + 12) % 12;
          return new Date(0, monthIndex).toLocaleString("default", { month: "short" });
        });
        setMonthLabels(labels);

        const userCol = collection(db, "users");
        const eventCol = collection(db, "events");
        const wishlistCol = collection(db, "wishlists");

        // Totale counts
        const [usersCountSnap, eventsCountSnap, wishlistsCountSnap] = await Promise.all([
          getCountFromServer(userCol),
          getCountFromServer(eventCol),
          getCountFromServer(wishlistCol),
        ]);

        const totalUsers = usersCountSnap.data().count;
        const totalEvents = eventsCountSnap.data().count;
        const totalWishlists = wishlistsCountSnap.data().count;

        // Document data
        const [usersSnap, wishlistsSnap, eventsSnap] = await Promise.all([
          getDocs(userCol),
          getDocs(wishlistCol),
          getDocs(eventCol),
        ]);

        const userData = usersSnap.docs.map(doc => doc.data());
        const wishlistData = wishlistsSnap.docs.map(doc => doc.data());
        const eventData = eventsSnap.docs.map(doc => doc.data());

        // Maandelijkse tellingen
        const countMonthly = (data: DocumentData[]) => {
          const result: Record<string, number> = {};
          data.forEach(item => {
            if (!item.createdAt) return;
            const date = typeof item.createdAt === "string" ? new Date(item.createdAt)
              : item.createdAt.toDate ? new Date(item.createdAt.toDate()) : new Date(item.createdAt);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            result[key] = (result[key] || 0) + 1;
          });
          return result;
        };

        const monthlyUsersCount = countMonthly(userData);
        const monthlyWishlistsCount = countMonthly(wishlistData);
        const monthlyEventsCount = countMonthly(eventData);

        // Laatste 12 maanden data
        const monthsData = Array.from({ length: 12 }, (_, i) => {
          const date = new Date(currentYear, currentMonth - 11 + i, 1);
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          return {
            users: monthlyUsersCount[key] || 0,
            wishlists: monthlyWishlistsCount[key] || 0,
            events: monthlyEventsCount[key] || 0,
          };
        });

        const usersGrowth = monthsData.map(d => d.users);
        const wishlistsGrowth = monthsData.map(d => d.wishlists);

        setMonthlyUsers(usersGrowth);
        setMonthlyWishlists(wishlistsGrowth);

        const cumulative = (arr: number[]) => {
          let sum = 0;
          return arr.map(n => sum += n);
        };

        setCumulativeUsers(cumulative(usersGrowth));
        setCumulativeWishlists(cumulative(wishlistsGrowth));
        setCumulativeEvents(cumulative(monthsData.map(d => d.events)));

        setStatistics({
          totalUsers,
          totalEvents,
          totalWishlists,
          wishlistUserPercentage: totalUsers ? (totalWishlists / totalUsers) * 100 : 0,
          eventUserPercentage: totalUsers ? (totalEvents / totalUsers) * 100 : 0,
        });
      } catch (err) {
        console.error("Error fetching metrics:", err);
      }
    };

    fetchStatistics();
  }, []);

  const growthChartData = {
    labels: monthLabels,
    datasets: [
      {
        label: "New Users",
        data: monthlyUsers,
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
      },
      {
        label: "New Wishlists",
        data: monthlyWishlists,
        borderColor: "rgba(243,9,44,1)",
        backgroundColor: "rgba(255,99,117,0.2)",
      },
    ],
  };

  const totalChartData = {
    labels: monthLabels,
    datasets: [
      {
        label: "Users",
        data: cumulativeUsers,
        borderColor: "rgba(75,108,192,1)",
        backgroundColor: "rgba(75,165,192,0.2)",
      },
      {
        label: "Wishlists",
        data: cumulativeWishlists,
        borderColor: "rgba(75,192,102,1)",
        backgroundColor: "rgba(104,255,99,0.2)",
      },
      {
        label: "Events",
        data: cumulativeEvents,
        borderColor: "rgba(243,9,52,1)",
        backgroundColor: "rgba(255,99,177,0.2)",
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 w-full justify-items-center">
        {[
          { label: "Users", value: statistics.totalUsers },
          { label: "Events", value: statistics.totalEvents },
          { label: "Wishlists", value: statistics.totalWishlists },
          { label: "Wishlist/User", value: statistics.wishlistUserPercentage, isPercent: true },
          { label: "Events/User", value: statistics.eventUserPercentage, isPercent: true },
        ].map(({ label, value, isPercent }) => (
          <div
            key={label}
            className="bg-gray-50 shadow-md p-6 rounded-lg w-full sm:w-60 lg:w-48 hover:shadow-lg transition-shadow duration-500"
          >
            <h2 className="text-center text-lg md:text-2xl text-cool-olive font-semibold">{label}</h2>
            <p className={`text-center font-bold mt-2 text-2xl md:text-4xl text-warm-olive`}>
              <CountUp start={0} end={value} duration={1} decimals={isPercent ? 1 : 0} />{isPercent ? "%" : ""}
            </p>
          </div>
        ))}
      </div>

      {/* Growth chart */}
      <div className="bg-white p-6 rounded-lg w-full mb-16 lg:w-11/12">
        <h2 className="text-xl md:text-2xl font-bold text-warm-olive mb-4 text-center">
          New Users & Wishlists (Last 12 Months)
        </h2>
        <div className="relative h-80">
          <Line data={growthChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
        </div>
      </div>

      {/* Cumulative chart */}
      <div className="bg-white p-6 rounded-lg w-full mb-16 lg:w-11/12">
        <h2 className="text-xl md:text-2xl font-bold text-warm-olive mb-4 text-center">
          Total Users, Wishlists & Events (Last 12 Months)
        </h2>
        <div className="relative h-80">
          <Line data={totalChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
        </div>
      </div>
    </div>
  );
}
