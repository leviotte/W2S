'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  // Zorg ervoor dat het inputveld update als de gebruiker de back/forward knoppen gebruikt
  useEffect(() => {
    setSearchTerm(searchParams.get('query') || '');
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('query', searchTerm.trim());
    
    // We gebruiken router.push om een nieuwe entry in de browsergeschiedenis te maken
    // en de pagina te laten herladen met de nieuwe searchParams.
    router.push(`/search?${newParams.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <Input
        type="search"
        placeholder="Zoek naar personen..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-grow"
      />
      <Button type="submit">
        <SearchIcon className="h-4 w-4 mr-2" />
        Zoeken
      </Button>
    </form>
  );
}