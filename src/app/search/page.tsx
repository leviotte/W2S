import { Suspense } from 'react';
import { SearchForm } from './_components/search-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zoek Vrienden | Wish2Share',
  description: 'Vind publieke profielen en wenslijsten op Wish2Share. Zoek op naam, stad, leeftijd en geslacht.',
  keywords: ['zoeken', 'vrienden', 'profielen', 'wenslijsten', 'wish2share'],
  openGraph: {
    title: 'Zoek Vrienden | Wish2Share',
    description: 'Vind publieke profielen en wenslijsten op Wish2Share.',
    type: 'website',
  },
};

export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <Suspense fallback={<PageSkeleton />}>
        <SearchForm />
      </Suspense>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center items-center gap-3">
        <LoadingSpinner />
        <span className="text-gray-600">Laden...</span>
      </div>
    </div>
  );
}