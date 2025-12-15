/**
 * components/landing/intro-video.tsx
 *
 * Client Component voor de interactieve introductievideo.
 * Dit component bevat alle state en event handlers voor de videospeler.
 * Geoptimaliseerd voor de Next.js App Router.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import Image from 'next/image';
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

export default function IntroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start gemuted voor autoplay-beleid
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showPoster, setShowPoster] = useState(true);

  const videoUrl =
    "https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fvideos%2FWish2Share%20video.mp4?alt=media&token=29ce3c27-106f-4c7f-b86c-2b6a62d57332";
  const posterUrl = "/wish2share.png"; // Gebruik je logo als placeholder


  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Voorkomt dat de klik bubbelt
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      setShowPoster(false);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    
    const newMutedState = !videoRef.current.muted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
  };
  
  // Effect om de video-events te beheren
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentProgress = (video.currentTime / video.duration) * 100;
      setProgress(currentProgress);
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    // Cleanup-functie
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  return (
    <div 
      className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl shadow-lg overflow-hidden cursor-pointer bg-slate-900"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        playsInline
        muted={isMuted}
        loop
      />

      {/* Poster afbeelding */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-300",
        showPoster ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <Image
          src={posterUrl}
          alt="Introductie tot Wish2Share"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
              <Play size={48} className="text-white fill-white" />
            </div>
        </div>
      </div>

      {/* Custom Controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300",
        showControls || !isPlaying ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex items-center gap-4">
          <button onClick={togglePlay} className="text-white">
            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
          </button>
          
          {/* Progress Bar */}
          <div className="relative w-full h-1 bg-white/20 rounded-full group">
            <div className="absolute h-1 bg-warm-olive rounded-full" style={{ width: `${progress}%` }} />
            <div 
              className="absolute -top-1 w-4 h-4 bg-warm-olive rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>

          <button onClick={toggleMute} className="text-white">
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
}