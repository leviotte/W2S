// app/dashboard/search/page.tsx
"use client"; // Dit is een client component omdat we state, events en Firebase gebruiken

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, Filter as FilterIcon } from "lucide-react";
import { collection, query, where, getDocs, orderBy, startAt, endAt } from "firebase/firestore";
import { db } from "@/lib/firebase"; // pas aan naar jouw firebase config path
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";
import LoadingSpinner from "@/components/LoadingSpinner";
import WishlistInviteHandler from "@/components/WishlistInviteHandler";

interface SearchResult {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  type: "account" | "profile";
  address?: { city?: string; country?: string };
  photoURL?: string;
  birthdate?: string;
  gender?: string;
  age?: number;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFirstName = searchParams.get("query") || "";

  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: "",
    city: "",
    gender: "",
  });

  const [filters, setFilters] = useState({
    city: "",
    minAge: "",
    maxAge: "",
    gender: "",
  });

  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 100]);

  // Auto-submit if query exists
  useEffect(() => {
    if (initialFirstName) handleSubmit();
  }, [initialFirstName]);

  useEffect(() => {
    if (cityInput) {
      setFilteredCities(
        availableCities.filter(city =>
          city.toLowerCase().includes(cityInput.toLowerCase())
        )
      );
    } else {
      setFilteredCities(availableCities);
    }
  }, [cityInput, availableCities]);

  const calculateAge = (birthdate: string) => {
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.firstName.trim()) {
      toast.error("Zonder voornaam kunnen we niet zoeken.");
      return;
    }
    setIsSearching(true);
    setHasSearched(true);

    try {
      const results: SearchResult[] = [];

      // Firebase users
      const usersRef = collection(db, "users");
      const userQuery = query(
        usersRef,
        where("isPublic", "==", true),
        orderBy("firstName_lower"),
        startAt(formData.firstName.toLowerCase()),
        endAt(formData.firstName.toLowerCase() + "\uf8ff")
      );
      const userSnapshots = await getDocs(userQuery);
      userSnapshots.forEach(doc => {
        const data = doc.data();
        const matchesLastName = !formData.lastName || data.lastName?.toLowerCase().startsWith(formData.lastName.toLowerCase());
        if (matchesLastName) {
          const age = data.birthdate ? calculateAge(data.birthdate) : undefined;
          results.push({
            id: doc.id,
            name: `${data.firstName} ${data.lastName || ""}`,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            photoURL: data.photoURL,
            address: { city: data.address?.city, country: data.address?.country },
            birthdate: data.birthdate,
            age,
            gender: data.gender,
            type: "account",
          });
        }
      });

      // Firebase profiles
      const profilesRef = collection(db, "profiles");
      const profileQuery = query(
        profilesRef,
        where("isPublic", "==", true),
        orderBy("name_lower"),
        startAt(formData.firstName.toLowerCase()),
        endAt(formData.firstName.toLowerCase() + "\uf8ff")
      );
      const profileSnapshots = await getDocs(profileQuery);
      profileSnapshots.forEach(doc => {
        const data = doc.data();
        const matchesName = !formData.lastName || data.name.toLowerCase().includes(formData.lastName.toLowerCase());
        if (matchesName) {
          const age = data.birthdate ? calculateAge(data.birthdate) : undefined;
          results.push({
            id: doc.id,
            name: data.name,
            photoURL: data.avatarURL,
            address: { city: data.address?.city, country: data.address?.country },
            birthdate: data.birthdate,
            age,
            gender: data.gender,
            type: "profile",
          });
        }
      });

      setAllResults(results);
      setFilteredResults(results);

      // Cities for filter
      const cities = results
        .map(r => r.address?.city)
        .filter((c): c is string => !!c)
        .filter((c, i, arr) => arr.indexOf(c) === i)
        .sort();
      setAvailableCities(cities);

      const ages = results.map(r => r.age).filter((a): a is number => a !== undefined);
      if (ages.length > 0) {
        const minAge = Math.min(...ages);
        const maxAge = Math.max(...ages);
        setAgeRange([minAge, maxAge]);
        setFilters(prev => ({ ...prev, minAge: minAge.toString(), maxAge: maxAge.toString() }));
      }

      applyFilters(results, filters);
    } catch (err) {
      console.error(err);
      toast.error("Er ging iets mis bij het zoeken");
    } finally {
      setIsSearching(false);
    }
  };

  const applyFilters = (results: SearchResult[], filters: any) => {
    const { city, minAge, maxAge, gender } = filters;
    const filtered = results.filter(result => {
      const matchesCity = !city || (result.address?.city && result.address.city === city);
      const matchesAge = (!minAge || !maxAge) || (result.age !== undefined && result.age >= parseInt(minAge) && result.age <= parseInt(maxAge));
      const matchesGender = !gender || (result.gender && result.gender.toLowerCase() === gender.toLowerCase());
      return matchesCity && matchesAge && matchesGender;
    });
    setFilteredResults(filtered);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(allResults, filters);
  };

  const handleResultClick = (r: SearchResult) => {
    router.push(`/dashboard/profiles/${r.type}/${r.id}?tab=users&subTab=profile`);
  };

  const handleCitySelect = (city: string) => {
    setFilters({ ...filters, city });
    setCityInput(city);
    setShowCityDropdown(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Voornaam</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Achternaam</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
            />
          </div>
        </div>
        <button type="submit" className="mt-2 bg-warm-olive text-white px-6 py-2 rounded-md flex items-center hover:bg-cool-olive">
          <SearchIcon className="h-5 w-5 mr-2" /> Zoek
        </button>
      </form>

      {/* Filters */}
      <form onSubmit={handleFilterSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 pt-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Stad</label>
            <input
              type="text"
              value={cityInput}
              onChange={e => { setCityInput(e.target.value); setShowCityDropdown(true); setFilters(prev => ({ ...prev, city: e.target.value })); }}
              onFocus={() => setShowCityDropdown(true)}
              onBlur={() => setTimeout(() => setShowCityDropdown(false), 180)}
              placeholder="Filter op stad"
              disabled={!hasSearched}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
            />
            {showCityDropdown && filteredCities.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md overflow-auto">
                <ul>
                  {filteredCities.map(city => (
                    <li key={city} className="px-4 py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleCitySelect(city)}>
                      {city}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Leeftijd</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={filters.minAge}
                onChange={e => setFilters({ ...filters, minAge: e.target.value })}
                placeholder="Min"
                min={0} max={120}
                disabled={!hasSearched}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
              />
              <span>-</span>
              <input
                type="number"
                value={filters.maxAge}
                onChange={e => setFilters({ ...filters, maxAge: e.target.value })}
                placeholder="Max"
                min={0} max={120}
                disabled={!hasSearched}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Geslacht</label>
            <select
              value={filters.gender}
              onChange={e => setFilters({ ...filters, gender: e.target.value })}
              disabled={!hasSearched}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
            >
              <option value="">Alle geslachten</option>
              <option value="male">Man</option>
              <option value="female">Vrouw</option>
              <option value="other">Anders</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={!hasSearched} className="bg-warm-olive text-white px-6 py-2 rounded-md flex items-center hover:bg-cool-olive">
          <FilterIcon className="h-5 w-5 mr-2" /> Filter
        </button>
      </form>

      {/* Results */}
      {isSearching ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : hasSearched && filteredResults.length > 0 ? (
        <div className="mt-8 space-y-6">
          {filteredResults.map(result => (
            <div key={result.id} className="p-4 rounded-xl shadow-xl flex items-center space-x-4 cursor-pointer hover:bg-slate-200 bg-slate-100" onClick={() => handleResultClick(result)}>
              <UserAvatar firstName={result.firstName || ""} lastName={result.lastName || ""} photoURL={result.photoURL} size="lg" />
              <div>
                <p className="text-md font-medium">{result.name}</p>
                <p className="text-sm text-gray-500">
                  {result.address?.city}{result.age && ` • ${result.age} jaar`}{result.gender && ` • ${result.gender === "male" ? "Man" : result.gender === "female" ? "Vrouw" : "Anders"}`}
                </p>
              </div>
            </div>
          ))}
          <div className="text-center py-12">
            <WishlistInviteHandler recipientFirstName={formData.firstName} recipientLastName={formData.lastName} recipientEmail="" />
          </div>
        </div>
      ) : hasSearched ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Geen resultaten.</p>
          <WishlistInviteHandler recipientFirstName={formData.firstName} recipientLastName={formData.lastName} recipientEmail="" />
        </div>
      ) : null}
    </div>
  );
}
