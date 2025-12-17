// src/app/search/page.tsx

import { Suspense } from 'react';
import Link from 'next/link';
import { performSearchAction } from './actions';
import { SearchForm } from './_components/search-form';
import { UserAvatar } from '@/components/shared/user-avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { SearchResult } from '@/types/user';

interface SearchPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = typeof searchParams.query === 'string' ? searchParams.query : '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Zoeken</h1>
        <p className="text-muted-foreground">Vind publieke profielen en wenslijsten op Wish2Share.</p>
      </header>
      
      <SearchForm />

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
    return <div className="text-center py-12 text-destructive">{result.error}</div>;
  }

  const data: SearchResult[] = result.data ?? [];

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="font-semibold">Geen resultaten</h3>
        <p className="text-muted-foreground">Er zijn geen publieke profielen gevonden voor &quot;{query}&quot;.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Resultaten voor &quot;{query}&quot;</h2>
      {data.map((user) => (
        <Link 
          href={`/profile/${user.username || user.id}`}
          key={user.id}
          className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm flex items-center gap-4 cursor-pointer transition-colors hover:bg-muted/50"
          aria-label={`Bekijk het profiel van ${user.displayName}`}
        >
          <UserAvatar 
            photoURL={user.photoURL}
            firstName={user.firstName}
            lastName={user.lastName}
            name={user.displayName}
            size="lg"
          />
          <div className="flex-grow">
            <p className="font-semibold text-lg">{user.displayName}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {user.city && <span>{user.city}</span>}
              {user.age && <span>{user.age} jaar</span>}
              {user.gender && <span>{user.gender}</span>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function InitialPrompt() {
  return (
    <div className="text-center py-12">
      <h3 className="font-semibold">Start met zoeken</h3>
      <p className="text-muted-foreground">Voer een naam in om te beginnen.</p>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="text-center py-12 flex justify-center items-center gap-3">
      <LoadingSpinner />
      <span className="text-muted-foreground">Resultaten laden...</span>
    </div>
  );
}