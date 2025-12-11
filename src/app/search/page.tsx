import { Suspense } from 'react';
import Link from 'next/link';
import { performSearchAction, type SearchResult } from './actions';
import { SearchForm } from './_components/search-form';
import { UserAvatar } from '@/components/shared/user-avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface SearchPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  // Haal de zoekterm veilig uit de URL parameters
  const query = typeof searchParams.query === 'string' ? searchParams.query : '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Zoeken</h1>
        <p className="text-muted-foreground">Vind publieke profielen op Wish2Share.</p>
      </header>
      
      <SearchForm />

      <main>
        <Suspense key={query} fallback={<SearchSkeleton />}>
          {/* We tonen de resultaten alleen als er een zoekopdracht is.
              Het 'key={query}' attribuut op Suspense is een pro-tip: 
              het zorgt ervoor dat de fallback opnieuw toont bij elke *nieuwe* zoekopdracht. */}
          {query ? <SearchResults query={query} /> : <InitialPrompt />}
        </Suspense>
      </main>
    </div>
  );
}

// Een apart asynchroon component voor het ophalen en tonen van de resultaten
async function SearchResults({ query }: { query: string }) {
  const result = await performSearchAction({ query });

  if (!result.success) {
    return <div className="text-center py-12 text-destructive">{result.error}</div>;
  }

  const data = result.data;

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
          href={user.username ? `/profile/${user.username}` : '#'}
          key={user.id}
          className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm flex items-center gap-4 cursor-pointer transition-colors hover:bg-muted/50"
          aria-label={`Bekijk het profiel van ${user.displayName}`}
        >
          <UserAvatar
            src={user.photoURL}
            name={user.displayName}
            className="h-14 w-14"
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

// Component dat wordt getoond voordat er een zoekopdracht is
function InitialPrompt() {
  return (
    <div className="text-center py-12">
      <h3 className="font-semibold">Start met zoeken</h3>
      <p className="text-muted-foreground">Voer een naam in om te beginnen met zoeken.</p>
    </div>
  )
}

// Een simpele skeleton loader voor een betere UX
function SearchSkeleton() {
  return (
    <div className="text-center py-12 flex justify-center items-center gap-3">
      <LoadingSpinner />
      <span className="text-muted-foreground">Resultaten laden...</span>
    </div>
  );
}