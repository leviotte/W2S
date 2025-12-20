'use client';

import Link from 'next/link';
import { UserAvatar } from '@/components/shared/user-avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WishlistInviteHandler } from './wishlist-invite-handler';
import type { SearchState, SearchFormData } from '../types';

interface SearchResultsProps {
  state: SearchState;
  searchData: SearchFormData;
}

export function SearchResults({ state, searchData }: SearchResultsProps) {
  const { isSearching, hasSearched, filteredResults, error } = state;

  // Loading state
  if (isSearching) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  // Results with data - EXACT zoals productie!
  if (hasSearched && filteredResults.length > 0) {
    return (
      <>
        <div className="mt-8 space-y-6">
          {filteredResults.map((result) => (
            <Link
              key={result.id}
              href={`/dashboard/profiles/${result.type}/${result.id}?tab=users&subTab=profile`}
              className="block p-4 border-none rounded-xl shadow-xl flex items-center space-x-4 cursor-pointer hover:bg-slate-200 bg-slate-100 transition-all duration-200"
            >
              <UserAvatar
                firstName={result.firstName || ''}
                lastName={result.lastName || ''}
                photoURL={result.photoURL}
                name={result.displayName}
                size="lg"
              />
              <div>
                <p className="text-md font-medium text-gray-900">
                  {result.displayName}
                </p>
                <p className="text-sm text-gray-500">
                  {result.city}
                  {result.age && ` • ${result.age} jaar`}
                  {result.gender &&
                    ` • ${
                      result.gender === 'male'
                        ? 'Man'
                        : result.gender === 'female'
                        ? 'Vrouw'
                        : 'Anders'
                    }`}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center py-12">
          <WishlistInviteHandler
            recipientFirstName={searchData.firstName}
            recipientLastName={searchData.lastName || ''}
            recipientEmail=""
          />
        </div>
      </>
    );
  }

  // No results
  if (hasSearched) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-8">Geen resultaten.</p>
        <WishlistInviteHandler
          recipientFirstName={searchData.firstName}
          recipientLastName={searchData.lastName || ''}
          recipientEmail=""
        />
      </div>
    );
  }

  // Initial state
  return null;
}