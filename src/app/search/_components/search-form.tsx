// src/app/search/_components/search-form.tsx
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

  useEffect(() => {
    setSearchTerm(searchParams.get('query') || '');
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('query', searchTerm.trim());
    router.push(`/search?${newParams.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-3 items-center">
        <div className="flex-grow relative">
          <Input
            type="search"
            placeholder="Zoek naar personen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-4 pr-4 text-base border-gray-300 focus:border-green-700 focus:ring-green-700"
          />
        </div>
        <Button 
          type="submit"
          className="h-12 px-6 bg-green-700 hover:bg-green-800 text-white font-medium"
        >
          <SearchIcon className="h-5 w-5 mr-2" />
          Zoeken
        </Button>
      </div>
    </form>
  );
}