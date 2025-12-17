// src/app/search/page.tsx

import { Suspense } from 'react';
import Link from 'next/link';
import { performSearchAction } from './actions';
import { SearchForm } from './_components/search-form';
import { UserAvatar } from '@/components/shared/user-avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SearchResult } from '@/types/user';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.query === 'string' ? params.query : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Zoeken
        </h1>
        <p className="mt-2 text-gray-600">
          Vind publieke profielen en wenslijsten op Wish2Share.
        </p>
      </div>
      
      {/* Search Form */}
      <div className="mb-8">
        <SearchForm />
      </div>

      {/* Results */}
      <main>
        <Suspense key={query} fallback={<SearchSkeleton />}>
          {query ? <SearchResults query={query} /> : <InitialPrompt />}
        </Suspense>
      </main>
    </div>
  );
}

async function SearchResults({ query }: { query: string }) {
  const result = await performSearchAction({ query });

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">{result.error}</p>
      </div>
    );
  }

  const data: SearchResult[] = result.data ?? [];

  if (data.length === 0) {
    return (
      <div className="text-center py-12 space-y-6">
        {/* No results message */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            Geen resultaten
          </h3>
          <p className="text-gray-600">
            Er zijn geen publieke profielen gevonden voor &quot;{query}&quot;.
          </p>
        </div>

        {/* Invite button */}
        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-4">
            Didn&apos;t find the person? Don&apos;t worry, invite them by clicking the button below!
          </p>
          <Button
            variant="default"
            className="bg-green-700 hover:bg-green-800"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Person
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Resultaten voor &quot;{query}&quot;
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {data.length} {data.length === 1 ? 'resultaat' : 'resultaten'} gevonden
        </p>
      </div>

      {/* Results list */}
      <div className="space-y-4">
        {data.map((user) => (
          <Link 
            href={`/profile/${user.username || user.id}`}
            key={user.id}
            className="block p-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <UserAvatar 
                photoURL={user.photoURL}
                firstName={user.firstName}
                lastName={user.lastName}
                name={user.displayName}
                size="lg"
              />
              
              {/* User info */}
              <div className="flex-grow">
                <p className="font-semibold text-lg text-gray-900">
                  {user.displayName}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mt-1">
                  {user.city && (
                    <span className="flex items-center">
                      {user.city}
                    </span>
                  )}
                  {user.age && (
                    <>
                      {user.city && <span>•</span>}
                      <span>{user.age} jaar</span>
                    </>
                  )}
                  {user.gender && (
                    <>
                      {(user.city || user.age) && <span>•</span>}
                      <span className="capitalize">{user.gender}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Invite section after results */}
      <div className="text-center py-8 border-t border-gray-200 mt-8">
        <p className="text-sm text-gray-500 mb-4">
          Didn&apos;t find the person? Don&apos;t worry, invite them by clicking the button below!
        </p>
        <Button
          variant="default"
          className="bg-green-700 hover:bg-green-800"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Person
        </Button>
      </div>
    </div>
  );
}

function InitialPrompt() {
  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          Start met zoeken
        </h3>
        <p className="text-gray-600">
          Voer een naam in om te beginnen met zoeken naar publieke profielen.
        </p>
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center items-center gap-3">
        <LoadingSpinner />
        <span className="text-gray-600">Resultaten laden...</span>
      </div>
    </div>
  );
}