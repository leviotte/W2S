"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, X, Mail } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase"; // pas je path aan naar je firebase config
import { toast } from "react-toastify";
import { useStore } from "@/src/lib/store/useStore";

export interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string | null;
}

interface ShareProfileSectionProps {
  profileId: string;
  managers: Manager[];
  onAddManager: (manager: Manager) => Promise<void>;
  onRemoveManager: (managerId: string) => Promise<void>;
}

export default function ShareProfileSection({
  profileId,
  managers,
  onAddManager,
  onRemoveManager,
}: ShareProfileSectionProps) {
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Manager[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const { currentUser } = useStore();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<Manager[]>([]);

  // Real-time users
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersList: Manager[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          firstName: doc.data().firstName || "",
          lastName: doc.data().lastName || "",
          email: doc.data().email || "",
          photoURL: doc.data().photoURL || null,
        }));
        setUsers(usersList);
      },
      (error) => console.error("Error listening to users:", error)
    );

    return () => unsubscribe();
  }, []);

  // Search by email
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchEmail.trim() || searchEmail.length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("email", ">=", searchEmail.toLowerCase()),
          where("email", "<=", searchEmail.toLowerCase() + "\uf8ff"),
          limit(5)
        );

        const querySnapshot = await getDocs(q);
        const results: Manager[] = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            firstName: doc.data().firstName || "",
            lastName: doc.data().lastName || "",
            email: doc.data().email || "",
            photoURL: doc.data().photoURL || null,
          }))
          .filter(
            (user) =>
              user.id !== currentUser?.id &&
              !managers.some((manager) => manager.id === user.id)
          );

        setSearchResults(results);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimeout = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchEmail, currentUser, managers]);

  const handleSelectUser = async (user: Manager) => {
    try {
      await onAddManager(user);
      setSearchEmail("");
      setSearchResults([]);
      setShowResults(false);
      toast.success("Beheerder toegevoegd");
    } catch (error) {
      console.error("Error adding manager:", error);
      toast.error("Er is iets misgegaan bij het toevoegen van de beheerder");
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-gray-100 shadow-xl rounded-lg p-8">
      <h2 className="text-lg font-semibold text-accent mb-4">
        Profielbeheerders
      </h2>

      <div className="relative mb-6" ref={searchContainerRef}>
        <input
          type="email"
          value={searchEmail}
          onChange={(e) => {
            setSearchEmail(e.target.value);
            setShowResults(true);
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowResults(true);
          }}
          placeholder="E-mailadres van beheerder"
          className="w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-warm-olive focus:ring-warm-olive p-2"
        />

        {showResults && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
            {isSearching ? (
              <div className="p-3 text-center text-gray-500">
                <span className="animate-spin inline-block mr-2">⌛</span> Zoeken...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer"
                >
                  <img
                    src={user.photoURL || "/default-avatar.png"}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-gray-500">
                Geen gebruiker gevonden
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {managers.length > 0 ? (
          managers.map((manager) => {
            const user = users.find((i) => i.id === manager.id);
            return (
              <div
                key={manager.id}
                className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={manager.photoURL || "/default-avatar.png"}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-gray-500">{manager.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveManager(manager.id)}
                  className="text-[#b34c4c] hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-4">
            Nog geen extra beheerders toegevoegd
          </p>
        )}
      </div>
    </div>
  );
}
