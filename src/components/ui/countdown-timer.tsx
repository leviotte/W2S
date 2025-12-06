/**
 * src/components/ui/countdown-timer.tsx
 *
 * Een herbruikbare, client-side countdown timer die animeert met react-countup.
 * Dit component is een perfect voorbeeld voor het gebruik van 'use client',
 * aangezien het state (useState) en lifecycle-effecten (useEffect) nodig heeft
 * om de timer elke seconde bij te werken.
 */
'use client';

import { useState, useEffect } from 'react';
import CountUp from 'react-countup';

// MENTOR-VERBETERING: Sterker getypeerde props met een optionele onComplete callback.
interface CountdownTimerProps {
  targetDate: string | Date;
  onComplete?: () => void;
  className?: string;
}

// MENTOR-VERBETERING: Tijdseenheden expliciet definiëren voor robuustheid.
type TimeUnit = 'Dagen' | 'Uren' | 'Minuten' | 'Seconden';
type TimeLeft = {
  [key in TimeUnit]?: number;
};

export default function CountdownTimer({
  targetDate,
  onComplete,
  className = '',
}: CountdownTimerProps) {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft: TimeLeft = {};

    if (difference > 0) {
      timeLeft = {
        Dagen: Math.floor(difference / (1000 * 60 * 60 * 24)),
        Uren: Math.floor((difference / (1000 * 60 * 60)) % 24),
        Minuten: Math.floor((difference / 1000 / 60) % 60),
        Seconden: Math.floor((difference / 1000) % 60),
      };
    } else {
      // MENTOR-VERBETERING: Timer is afgelopen, toon nullen.
      timeLeft = { Dagen: 0, Uren: 0, Minuten: 0, Seconden: 0 };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Zorgt ervoor dat dit component pas runt op de client, voorkomt hydration errors.
    setIsClient(true);

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Als de timer is afgelopen
      if (Object.values(newTimeLeft).every((val) => val === 0)) {
        clearInterval(timer);
        if (onComplete) {
          onComplete();
        }
      }
    }, 1000);

    // Cleanup-functie om de interval te stoppen als het component unmount.
    return () => clearInterval(timer);
    // We laten de dependency array leeg om de timer maar één keer te starten.
    // De onComplete functie kan veranderen, maar we willen de timer niet herstarten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  if (!isClient) {
    // Toon een placeholder of niets tijdens Server-Side Rendering.
    return null;
  }

  const timerComponents = Object.keys(timeLeft) as TimeUnit[];

  return (
    <div className={`flex justify-center items-center gap-2 sm:gap-4 ${className}`}>
      {timerComponents.map((unit) => (
        <div key={unit} className="flex flex-col items-center">
          <div className="text-2xl sm:text-4xl font-bold text-primary tabular-nums">
            <CountUp
              start={timeLeft[unit]! + 1} // Geeft een beter effect als de seconde verspringt
              end={timeLeft[unit]!}
              duration={0.8}
              separator=""
            />
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
            {unit}
          </div>
        </div>
      ))}
    </div>
  );
}