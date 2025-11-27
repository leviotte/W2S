// app/search/page.tsx
import { Suspense, useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, Filter as FilterIcon } from "lucide-react";
import { toast } from "react-toastify";
import { collection, query, where, getDocs, orderBy, startAt, endAt } from "firebase/firestore";
import { db } from "../../config/firebase";

import UserAvatar from "../../components/UserAvatar";
import LoadingSpinner from "../../components/LoadingSpinner";
import WishlistInviteHandler from "../../components/WishlistInviteHandler";

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

export const metadata = {
  title: "Zoek Vrienden | Wish2Share",
  description: "Vind en ontdek publieke accounts en profielen op Wish2Share.",
  openGraph: {
    title: "Zoek Vrienden | Wish2Share",
    description: "Vind en ontdek publieke accounts en profielen op Wish2Share.",
    url: "https://yourdomain.com/search",
  },
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFirstName = searchParams.get("query") || "";

  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [formData, setFormData] = useState({ firstName: initialFirstName, lastName: "", city: "", gender: "" });
  const [filters, setFilters] = useState({ city: "", minAge: "", maxAge: "", gender: "" });
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 100]);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialFirstName) handleSubmit(); // Auto search
  }, [initialFirstName]);

  useEffect(() => {
    if (cityInput) {
      const filtered = availableCities.filter((city) =>
        city.toLowerCase().includes(cityInput.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(availableCities);
    }
  }, [cityInput, availableCities]);

  const calculateAge = (birthdate: string) => {
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
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
      // Users
      const usersRef = collection(db, "users");
      const userQuery = query(
        usersRef,
        where("isPublic", "==", true),
        orderBy("firstName_lower"),
        startAt(formData.firstName.toLowerCase()),
        endAt(formData.firstName.toLowerCase() + "\uf8ff")
      );
      const userSnapshots = await getDocs(userQuery);
      userSnapshots.forEach((doc) => {
        const u = doc.data();
        const matchesLastName = !formData.lastName || u.lastName?.toLowerCase().startsWith(formData.lastName.toLowerCase());
        if (matchesLastName) {
          const age = u.birthdate ? calculateAge(u.birthdate) : undefined;
          results.push({
            id: doc.id,
            name: `${u.firstName} ${u.lastName || ""}`,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            photoURL: u.photoURL,
            address: { city: u.address?.city, country: u.address?.country },
            birthdate: u.birthdate,
            age,
            gender: u.gender,
            type: "account",
          });
        }
      });

      // Profiles
      const profilesRef = collection(db, "profiles");
      const profileQuery = query(
        profilesRef,
        where("isPublic", "==", true),
        orderBy("name_lower"),
        startAt(formData.firstName.toLowerCase()),
        endAt(formData.firstName.toLowerCase() + "\uf8ff")
      );
      const profileSnapshots = await getDocs(profileQuery);
      profileSnapshots.forEach((doc) => {
        const p = doc.data();
        const matchesName = !formData.lastName || p.name.toLowerCase().includes(formData.lastName.toLowerCase());
        if (matchesName) {
          const age = p.birthdate ? calculateAge(p.birthdate) : undefined;
          results.push({
            id: doc.id,
            name: p.name,
            photoURL: p.avatarURL,
            address: { city: p.address?.city, country: p.address?.country },
            birthdate: p.birthdate,
            age,
            gender: p.gender,
            type: "profile",
          });
        }
      });

      setAllResults(results);
      setFilteredResults(results);

      // Cities
      const cities = results
        .map((r) => r.address?.city)
        .filter((c): c is string => !!c)
        .filter((city, index, self) => self.indexOf(city) === index)
        .sort();
      setAvailableCities(cities);

      // Age range
      const ages = results.map((r) => r.age).filter((a): a is number => a !== undefined);
      if (ages.length > 0) {
        const minAge = Math.min(...ages);
        const maxAge = Math.max(...ages);
        setAgeRange([minAge, maxAge]);
        setFilters((prev) => ({ ...prev, minAge: minAge.toString(), maxAge: maxAge.toString() }));
      }

      applyFilters(results, filters);
    } catch (err) {
      console.error(err);
      toast.error("Er ging iets mis bij het zoeken.");
    } finally {
      setIsSearching(false);
    }
  };

  const applyFilters = (results: SearchResult[], filters: any) => {
    const { city, minAge, maxAge, gender } = filters;
    const filtered = results.filter((r) => {
      const matchesCity = !city || (r.address?.city && r.address.city === city);
      const matchesAge =
        !minAge || !maxAge || (r.age !== undefined && r.age >= parseInt(minAge) && r.age <= parseInt(maxAge));
      const matchesGender = !gender || (r.gender && r.gender.toLowerCase() === gender.toLowerCase());
      return matchesCity && matchesAge && matchesGender;
    });
    setFilteredResults(filtered);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(allResults, filters);
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(`/dashboard/profiles/${result.type}/${result.id}?tab=users&subTab=profile`);
  };

  const handleCitySelect = (city: string) => {
    setFilters({ ...filters, city });
    setCityInput(city);
    setShowCityDropdown(false);
  };

  const handleAgeRangeChange = (type: "min" | "max", value: string) => {
    if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 120)) {
      setFilters({ ...filters, [type === "min" ? "minAge" : "maxAge"]: value });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Voornaam</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Achternaam</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-warm-olive text-white px-6 py-2 rounded-md hover:bg-cool-olive flex items-center mt-2"
        >
          <SearchIcon className="h-5 w-5 mr-2" /> Zoek
        </button>
      </form>

      {/* Filters */}
      <form onSubmit={handleFilterSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Stad</label>
            <input
              type="text"
              value={cityInput}
              onChange={(e) => {
                setCityInput(e.target.value);
                setFilters((prev) => ({ ...prev, city: e.target.value }));
                setShowCityDropdown(true);
              }}
              onFocus={() => setShowCityDropdown(true)}
              onBlur={() => setTimeout(() => setShowCityDropdown(false), 180)}
              placeholder="Filter op stad"
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
              disabled={!hasSearched}
            />
            {showCityDropdown && filteredCities.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md overflow-auto">
                <ul className="py-1">
                  {filteredCities.map((city) => (
                    <li key={city} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleCitySelect(city)}>
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
                onChange={(e) => handleAgeRangeChange("min", e.target.value)}
                placeholder="Min"
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                disabled={!hasSearched}
              />
              <span>-</span>
              <input
                type="number"
                value={filters.maxAge}
                onChange={(e) => handleAgeRangeChange("max", e.target.value)}
                placeholder="Max"
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                disabled={!hasSearched}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Geslacht</label>
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
              disabled={!hasSearched}
            >
              <option value="">Alle geslachten</option>
              <option value="male">Man</option>
              <option value="female">Vrouw</option>
              <option value="other">Anders</option>
            </select>
          </div>
        </div>
        <button type="submit" className="bg-warm-olive text-white px-6 py-2 rounded-md hover:bg-cool-olive flex items-center mt-2" disabled={!hasSearched}>
          <FilterIcon className="h-5 w-5 mr-2" /> Filter
        </button>
      </form>

      {isSearching || isPending ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : hasSearched && filteredResults.length > 0 ? (
        <Suspense>
          <div className="mt-8 space-y-6">
            {filteredResults.map((r) => (
              <div key={r.id} onClick={() => handleResultClick(r)} className="p-4 border-none rounded-xl shadow-xl flex items-center space-x-4 cursor-pointer hover:bg-slate-200 bg-slate-100">
                <UserAvatar firstName={r.firstName || ""} lastName={r.lastName || ""} photoURL={r.photoURL} size="lg" />
                <div>
                  <p className="text-md font-medium">{r.name}</p>
                  <p className="text-sm text-gray-500">
                    {r.address?.city}
                    {r.age && ` • ${r.age} jaar`}
                    {r.gender && ` • ${r.gender === "male" ? "Man" : r.gender === "female" ? "Vrouw" : "Anders"}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center py-12">
            <WishlistInviteHandler recipientFirstName={formData.firstName} recipientLastName={formData.lastName} recipientEmail={""} />
          </div>
        </Suspense>
      ) : (
        hasSearched && (
          <div className="text-center py-12">
            <p className="text-gray-500">Geen resultaten.</p>
            <WishlistInviteHandler recipientFirstName={formData.firstName} recipientLastName={formData.lastName} recipientEmail={""} />
          </div>
        )
      )}
    </div>
  );
}
