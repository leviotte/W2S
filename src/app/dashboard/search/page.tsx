"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, Filter as FilterIcon } from "lucide-react";
import { collection, query, where, getDocs, orderBy, startAt, endAt } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import WishlistInviteHandler from "@/components/wishlist/WishlistInviteHandler";
import { UserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchResult = Partial<UserProfile> & {
  id: string;
  type: "account" | "profile";
  age?: number;
  name?: string; // Toegevoegd voor subprofielen
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFirstName = searchParams.get("query") || "";

  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [formData, setFormData] = useState({ firstName: initialFirstName, lastName: "" });
  const [filters, setFilters] = useState({ city: "", minAge: "", maxAge: "", gender: "" });

  const calculateAge = (birthdate: string) => {
    // ... (jouw implementatie)
    return new Date().getFullYear() - new Date(birthdate).getFullYear();
  };
  
  const performSearch = useCallback(async () => {
    if (!formData.firstName.trim()) {
      if (hasSearched) toast.error("Zonder voornaam kunnen we niet zoeken.");
      return;
    }
    setIsSearching(true);
    setHasSearched(true);

    try {
      const results: SearchResult[] = [];
      
      const userQuery = query(
        collection(db, "users"),
        where("isPublic", "==", true),
        orderBy("firstName"),
        startAt(formData.firstName.toLowerCase()),
        endAt(formData.firstName.toLowerCase() + "\uf8ff")
      );
      const userSnapshots = await getDocs(userQuery);
      userSnapshots.forEach(doc => {
        const data = doc.data() as UserProfile;
        results.push({
          ...data,
          id: doc.id,
          type: "account",
          age: data.birthdate ? calculateAge(data.birthdate) : undefined,
        });
      });
      
      setAllResults(results);
      applyFilters(results, filters);

    } catch (err) {
      console.error(err);
      toast.error("Er ging iets mis bij het zoeken");
    } finally {
      setIsSearching(false);
    }
  }, [formData.firstName]);


  useEffect(() => {
    if (initialFirstName) {
      performSearch();
    }
  }, [initialFirstName, performSearch]);

  const applyFilters = (results: SearchResult[], currentFilters: typeof filters) => {
    // Jouw filter logica hier...
    // setFilteredResults(filtered);
  };

  const handleResultClick = (r: SearchResult) => {
    // Logic om naar profiel te gaan
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
      <form onSubmit={(e) => { e.preventDefault(); performSearch(); }} className="space-y-4">
        {/* ... je formulier ... */}
      </form>
      
      {/* ... je filters ... */}

      {isSearching ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : hasSearched && allResults.length > 0 ? (
        <div className="mt-8 space-y-6">
          {allResults.map(result => (
            <div key={result.id} className="p-4 rounded-xl shadow-xl flex items-center space-x-4 cursor-pointer hover:bg-slate-200 bg-slate-100" onClick={() => handleResultClick(result)}>
              {/* CORRECTIE: Gebruik 'name' en 'src' props, net als in de header */}
              <UserAvatar 
                src={result.photoURL} 
                name={result.name || `${result.firstName} ${result.lastName}`} 
                size="lg" 
              />
              <div>
                <p className="text-md font-medium">{result.name || `${result.firstName} ${result.lastName}`}</p>
                {/* ... overige details ... */}
              </div>
            </div>
          ))}
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