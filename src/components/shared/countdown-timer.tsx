// src/components/shared/countdown-timer.tsx
"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string | Date;
  targetTime?: string;
  isRed?: boolean;
}

export default function CountdownTimer({
  targetDate,
  targetTime = "00:00",
  isRed = true,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const calculateTimeLeft = () => {
      try {
        // Convert to Date if string
        const dateObj = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
        
        // Ensure valid date format (YYYY-MM-DD)
        const formattedDate = dateObj.toISOString().split("T")[0];
        
        if (!formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.error("Invalid date format:", targetDate);
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        // Ensure valid time format (HH:mm)
        const formattedTime = targetTime?.match(/^\d{2}:\d{2}$/)
          ? targetTime
          : "00:00";

        const target = new Date(`${formattedDate}T${formattedTime}`);
        if (isNaN(target.getTime())) {
          console.error(
            "Invalid date/time combination:",
            formattedDate,
            formattedTime
          );
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const now = new Date();
        const difference = target.getTime() - now.getTime();

        if (difference <= 0) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
      } catch (error) {
        console.error("Error calculating time left:", error);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft()); // Initial calculation

    return () => clearInterval(timer);
  }, [targetDate, targetTime]);

  // Don't render during SSR
  if (!isClient) {
    return null;
  }

  if (
    !targetDate ||
    (timeLeft.days === 0 &&
      timeLeft.hours === 0 &&
      timeLeft.minutes === 0 &&
      timeLeft.seconds === 0)
  ) {
    return null;
  }

  return (
    <div className={`flex items-center font-bold ${isRed ? 'text-[#b34c4c]' : 'text-warm-olive'}`}>
      <Clock className="h-4 w-4 mr-2" />
      <span>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}