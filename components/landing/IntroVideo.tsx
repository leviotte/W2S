'use client';

import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export function IntroVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start gemute, best practice voor autoplay
  const [volume, setVolume] = useState(0.5);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoUrl =
    'https://firebasestorage.googleapis.com/v0/b/wish2share4u.appspot.com/o/public%2Fvideos%2FWish2Share%20video.mp4?alt=media&token=29ce3c27-106f-4c7f-b86c-2b6a62d57332';
  const posterUrl = 'https://i.ytimg.com/vi/0XeMHsvcVec/hqdefault.jpg';

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
      if (!newMutedState && videoRef.current.volume === 0) {
        videoRef.current.volume = 0.5; // Zet volume terug als je unmute
        setVolume(0.5);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-lg border-2 border-border bg-card p-4 shadow-lg">
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            className="h-full w-full rounded object-cover"
            playsInline // Belangrijk voor iOS
            muted // Start gemute
            loop
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          ></video>

          {/* Custom Controls Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity opacity-0 hover:opacity-100">
             <button
                onClick={togglePlay}
                className="text-white drop-shadow-lg focus:outline-none"
                aria-label={isPlaying ? 'Pauzeer video' : 'Speel video af'}
              >
                {isPlaying ? (
                   <Pause size={48} strokeWidth={1.5} className="bg-black/50 rounded-full p-2" />
                ) : (
                  <Play size={48} strokeWidth={1.5} className="bg-black/50 rounded-full p-2" />
                )}
              </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 rounded-b bg-gradient-to-t from-black/70 to-transparent p-2">
            <div className="flex items-center justify-between">
              <button
                onClick={togglePlay}
                className="text-white hover:text-white/80 focus:outline-none"
                 aria-label={isPlaying ? 'Pauzeer' : 'Afspelen'}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-white/80 focus:outline-none"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}