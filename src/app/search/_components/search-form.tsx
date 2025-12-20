'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon, Filter as FilterIcon } from 'lucide-react';
import { toast } from 'sonner';
import { searchUsersAction } from '../actions';
import { SearchResults } from './search-results';
import { useDebounce } from '@/hooks/use-debounce';
import type { SearchResult, SearchState, FilterData } from '../types';

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ✅ URL state initialization
  const initialFirstName = searchParams.get('firstName') || '';
  const initialLastName = searchParams.get('lastName') || '';

  // Form state
  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
  });

  // Filter state
  const [filters, setFilters] = useState<FilterData>({
    city: searchParams.get('city') || '',
    minAge: searchParams.get('minAge') ? parseInt(searchParams.get('minAge')!) : undefined,
    maxAge: searchParams.get('maxAge') ? parseInt(searchParams.get('maxAge')!) : undefined,
    gender: (searchParams.get('gender') as any) || '',
  });

  // City autocomplete
  const [cityInput, setCityInput] = useState(filters.city || '');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const debouncedCityInput = useDebounce(cityInput, 300);

  // Search state
  const [state, setState] = useState<SearchState>({
    allResults: [],
    filteredResults: [],
    availableCities: [],
    ageRange: [0, 100],
    isSearching: false,
    hasSearched: false,
    error: null,
  });

  // ✅ Auto-search on mount if query exists
  useEffect(() => {
    if (initialFirstName) {
      handleSubmit();
    }
  }, []); // Only run once on mount

  // ✅ Filtered cities based on debounced input
  const filteredCities = useMemo(() => {
    if (!debouncedCityInput) return state.availableCities;
    return state.availableCities.filter((city) =>
      city.toLowerCase().includes(debouncedCityInput.toLowerCase())
    );
  }, [debouncedCityInput, state.availableCities]);

  // ✅ Apply filters to results (client-side filtering!)
  const applyFilters = useCallback(
    (results: SearchResult[], currentFilters: FilterData) => {
      const { city, minAge, maxAge, gender } = currentFilters;

      const filtered = results.filter((result) => {
        const matchesCity =
          !city || (result.city && result.city.toLowerCase().includes(city.toLowerCase()));

        const matchesAge =
          (minAge === undefined && maxAge === undefined) ||
          (result.age !== undefined &&
            (minAge === undefined || result.age >= minAge) &&
            (maxAge === undefined || result.age <= maxAge));

        const matchesGender =
          !gender ||
          (result.gender && result.gender.toLowerCase() === gender.toLowerCase());

        return matchesCity && matchesAge && matchesGender;
      });

      setState((prev) => ({ ...prev, filteredResults: filtered }));
      
      // ✅ Update URL with filter params
      updateURL({ ...formData, ...currentFilters });
    },
    [formData]
  );

  // ✅ Handle search submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const { firstName, lastName } = formData;

    if (!firstName.trim()) {
      toast.error('Zonder voornaam kunnen we niet zoeken.');
      return;
    }

    setState((prev) => ({ ...prev, isSearching: true, hasSearched: true, error: null }));

    const result = await searchUsersAction(firstName, lastName);

    if (!result.success || !result.data) {
      setState((prev) => ({
        ...prev,
        isSearching: false,
        error: result.error || 'Er ging iets mis',
      }));
      toast.error(result.error || 'Er ging iets mis bij het zoeken');
      return;
    }

    const results = result.data;

    // Extract unique cities
    const cities = results
      .map((r) => r.city)
      .filter((city): city is string => !!city)
      .filter((city, index, self) => self.indexOf(city) === index)
      .sort();

    // Find age range
    const ages = results
      .map((r) => r.age)
      .filter((age): age is number => age !== undefined);

    let ageRange: [number, number] = [0, 100];
    let defaultMinAge = undefined;
    let defaultMaxAge = undefined;

    if (ages.length > 0) {
      const minAge = Math.min(...ages);
      const maxAge = Math.max(...ages);
      ageRange = [minAge, maxAge];
      defaultMinAge = minAge;
      defaultMaxAge = maxAge;
    }

    setState({
      allResults: results,
      filteredResults: results,
      availableCities: cities,
      ageRange,
      isSearching: false,
      hasSearched: true,
      error: null,
    });

    // Reset filters to defaults
    const newFilters: FilterData = {
  city: '',
  minAge: defaultMinAge,
  maxAge: defaultMaxAge,
  gender: '', // Now correctly typed!
};
setFilters(newFilters);
setCityInput('');

    // Update URL
    updateURL({ firstName, lastName, ...newFilters });
  };

  // ✅ Handle filter submit
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(state.allResults, filters);
    toast.success('Filters toegepast');
  };

  // ✅ Handle city select from dropdown
  const handleCitySelect = (city: string) => {
    setFilters({ ...filters, city });
    setCityInput(city);
    setShowCityDropdown(false);
  };

  // ✅ Handle age range change with validation
  const handleAgeRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseInt(value);
    
    if (numValue === undefined || (numValue >= 0 && numValue <= 120)) {
      setFilters({
        ...filters,
        [type === 'min' ? 'minAge' : 'maxAge']: numValue,
      });
    }
  };

  // ✅ Update URL with current state
  const updateURL = (params: any) => {
    const urlParams = new URLSearchParams();
    
    if (params.firstName) urlParams.set('firstName', params.firstName);
    if (params.lastName) urlParams.set('lastName', params.lastName);
    if (params.city) urlParams.set('city', params.city);
    if (params.minAge !== undefined) urlParams.set('minAge', params.minAge.toString());
    if (params.maxAge !== undefined) urlParams.set('maxAge', params.maxAge.toString());
    if (params.gender) urlParams.set('gender', params.gender);

    router.push(`/search?${urlParams.toString()}`, { scroll: false });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Voornaam */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              Voornaam
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="block w-full rounded-md border-2 border-gray-300 px-4 py-2.5 shadow-sm focus:border-warm-olive focus:ring-warm-olive focus:outline-none transition-colors"
              placeholder="Voornaam"
            />
          </div>

          {/* Achternaam */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Achternaam
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="block w-full rounded-md border-2 border-gray-300 px-4 py-2.5 shadow-sm focus:border-warm-olive focus:ring-warm-olive focus:outline-none transition-colors"
              placeholder="Achternaam (optioneel)"
            />
          </div>
        </div>

        {/* Zoek Button */}
        <div className="flex justify-between">
          <button
            type="submit"
            disabled={state.isSearching}
            className="bg-warm-olive text-white px-6 py-2.5 rounded-md hover:bg-cool-olive flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <SearchIcon className="h-5 w-5" />
            {state.isSearching ? 'Zoeken...' : 'Zoek'}
          </button>
        </div>
      </form>

      {/* ✅ FILTER SECTION - Only show after search */}
      {state.hasSearched && (
        <form onSubmit={handleFilterSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            
            {/* ✅ Stad Filter met Autocomplete */}
            <div className="relative">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Stad
              </label>
              <input
                id="city"
                type="text"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setFilters((prev) => ({ ...prev, city: e.target.value }));
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowCityDropdown(false), 200);
                }}
                className="block w-full rounded-md border-2 border-gray-300 px-4 py-2.5 shadow-sm focus:border-warm-olive focus:ring-warm-olive focus:outline-none transition-colors"
                placeholder="Filter op stad"
              />
              
              {/* City Dropdown */}
              {showCityDropdown && filteredCities.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md overflow-auto border border-gray-200">
                  <ul className="py-1">
                    {filteredCities.map((city) => (
                      <li
                        key={city}
                        className="px-4 py-2 hover:bg-warm-olive hover:text-white cursor-pointer transition-colors"
                        onClick={() => handleCitySelect(city)}
                      >
                        {city}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ✅ Leeftijd Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leeftijd
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.minAge ?? ''}
                  onChange={(e) => handleAgeRangeChange('min', e.target.value)}
                  className="block w-full rounded-md border-2 border-gray-300 px-4 py-2.5 shadow-sm focus:border-warm-olive focus:ring-warm-olive focus:outline-none transition-colors"
                  placeholder="Min"
                  min="0"
                  max="120"
                />
                <span className="text-gray-500 font-medium">-</span>
                <input
                  type="number"
                  value={filters.maxAge ?? ''}
                  onChange={(e) => handleAgeRangeChange('max', e.target.value)}
                  className="block w-full rounded-md border-2 border-gray-300 px-4 py-2.5 shadow-sm focus:border-warm-olive focus:ring-warm-olive focus:outline-none transition-colors"
                  placeholder="Max"
                  min="0"
                  max="120"
                />
              </div>
            </div>

            {/* ✅ Geslacht Filter */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Geslacht
              </label>
              <select
                id="gender"
                value={filters.gender || ''}
                onChange={(e) =>
                  setFilters({ ...filters, gender: e.target.value as any })
                }
                className="block w-full rounded-md border-2 border-gray-300 px-4 py-2.5 shadow-sm focus:border-warm-olive focus:ring-warm-olive focus:outline-none transition-colors bg-white"
              >
                <option value="">Alle geslachten</option>
                <option value="male">Man</option>
                <option value="female">Vrouw</option>
                <option value="other">Anders</option>
              </select>
            </div>
          </div>

          {/* Filter Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-warm-olive text-white px-6 py-2.5 rounded-md hover:bg-cool-olive flex items-center gap-2 transition-all font-medium"
            >
              <FilterIcon className="h-5 w-5" />
              Filter
            </button>
          </div>
        </form>
      )}

      {/* ✅ RESULTS */}
      <SearchResults state={state} searchData={formData} />
    </>
  );
}