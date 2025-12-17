/**
 * components/landing/intro-video.tsx
 *
 * Client Component voor de introductievideo.
 * AANGEPAST OM DE OUDE, SIMPELE LAYOUT TE EVENAREN.
 */
"use client";

import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export default function IntroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const videoUrl =
    "https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fvideos%2FWish2Share%20video.mp4?alt=media&token=29ce3c27-106f-4c7f-b86c-2b6a62d57332";
  const posterUrl = "https://i.ytimg.com/vi/0XeMHsvcVec/hqdefault.jpg";

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-lg border-2 border-gray-200 bg-warm-beige p-4 shadow-lg">
        <div className="relative">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            className="max-h-[260px] w-full rounded object-cover object-center"
            playsInline
            loop
            muted={isMuted}
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Custom Controls */}
          <div className="absolute inset-x-0 bottom-0 rounded-b bg-gradient-to-t from-black/70 to-transparent p-2">
            <div className="flex items-center justify-between space-x-3">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 focus:outline-none"
              >
                {isPlaying ? (
                  <Pause size={20} strokeWidth="4" fill="#fff" />
                ) : (
                  <Play size={20} strokeWidth="4" fill="#fff" />
                )}
              </button>

              {/* Volume Control */}
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300 focus:outline-none"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}