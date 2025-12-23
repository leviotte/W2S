// src/components/shared/ProductImageCarousel.tsx
'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

type ProductImageCarouselProps = {
  images?: string[];
  alt?: string;
  className?: string;
};

export default function ProductImageCarousel({ images = [], alt = '', className = '' }: ProductImageCarouselProps) {
  if (!images.length) return null;
  return (
    <Swiper
      spaceBetween={10}
      slidesPerView={1}
      style={{ width: '100%', height: '100%' }}
    >
      {images.map((url, idx) => (
        <SwiperSlide key={idx}>
          <img
            src={url}
            alt={alt || ''}
            className={`object-contain w-full h-24 sm:h-32 rounded border bg-white ${className}`}
            style={{ maxHeight: 120, width: "100%" }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}