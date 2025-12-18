// src/components/followers/followers-following-cards.tsx
"use client";

import { motion } from "framer-motion";
import { Users, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export type FollowStats = {
  followers: number;
  following: number;
};

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
      onClick: () => router.push("/profile/followers"),
    },
    {
      id: 2,
      label: "Following",
      count: followingCount,
      Icon: UserCheck,
      onClick: () => router.push("/profile/following"),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {stats.map((stat) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onClick={stat.onClick}
          className="bg-gradient-to-br from-green-800 to-green-900 dark:from-green-900 dark:to-green-950 cursor-pointer shadow-lg rounded-xl p-8 flex flex-col gap-6 transition-all duration-300 hover:shadow-xl hover:shadow-green-700/50 hover:-translate-y-1 min-h-[180px]"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <stat.Icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {stat.label}
            </h3>
          </div>
          <div className="text-5xl font-bold text-white mt-auto">
            {stat.count}
          </div>
        </motion.div>
      ))}
    </div>
  );
}