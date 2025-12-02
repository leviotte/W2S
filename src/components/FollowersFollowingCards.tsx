// app/components/FollowersFollowingCards.tsx
"use client";

import { motion } from "framer-motion";
import { Users, UserCheck } from "lucide-react"; // Icons from Lucide
import { useRouter } from "next/navigation";

interface FollowersFollowingCardsProps {
  followersCount: number;
  followingCount: number;
}

export default function FollowersFollowingCards({
  followersCount,
  followingCount,
}: FollowersFollowingCardsProps) {
  const router = useRouter();

  const stats = [
    {
      id: 1,
      label: "Followers",
      count: followersCount,
      Icon: Users,
      onClick: () => router.push("/dashboard?tab=user&subTab=followers"),
    },
    {
      id: 2,
      label: "Following",
      count: followingCount,
      Icon: UserCheck,
      onClick: () => router.push("/dashboard?tab=user&subTab=following"),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2 sm:p-4">
      {stats.map((stat) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-green-900 cursor-pointer shadow-md rounded-xl p-6 flex flex-col gap-4 transition-shadow duration-500 hover:shadow-lime-700 hover:shadow-md"
          onClick={stat.onClick}
        >
          <div className="flex items-center gap-4">
            <stat.Icon className="w-8 h-8 text-green-700 dark:text-green-300" />
            <h3 className="text-lg font-semibold text-green-900 dark:text-white mb-1">
              {stat.label}
            </h3>
          </div>
          <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
            {stat.count}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
