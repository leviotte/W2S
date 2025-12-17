/**
 * components/landing/intro-video.tsx
 *
 * Client Component voor de introductievideo.
 * Beperkt tot max-w-4xl zonder horizontale stretch.
 */
"use client";

import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export default function IntroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const videoUrl =
    "https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fvideos%2FWish2Share%20video.mp4?alt=media&token=29ce3c27-106f-4c7f-b86c-2b6a62d57332";
  const posterUrl = "https://i.ytimg.com/vi/0XeMHsvcVec/hqdefault.jpg";

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="max-h-[340px]">
        <div className="border-2 border-gray-200 rounded-lg shadow-lg p-4 bg-warm-beige">
          <div className="relative">
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              className="w-full max-h-[260px] object-cover object-center rounded"
              playsInline
              loop
              onTimeUpdate={() => {}}
              onLoadedMetadata={() => {}}
            />

            {/* Custom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 rounded-b">
              <div className="flex items-center justify-between space-x-3">
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-gray-300 focus:outline-none"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? (
                    <Pause size={20} stroke="4" fill="#fff" />
                  ) : (
                    <Play size={20} stroke="4" fill="#fff" />
                  )}
                </button>

                {/* Volume Control */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-gray-300 focus:outline-none"
                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}