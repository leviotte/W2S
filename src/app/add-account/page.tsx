'use client';

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/client/firebase";
import {
  collection,
  serverTimestamp,
  query,
  getDocs,
  doc,
  setDoc,
  addDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";

export default function AddAccountPage() {
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [tiktok, setTikTok] = useState("");
  const [pinterest, setPinterest] = useState("");
  const [loading, setLoading] = useState(true);
  const [docId, setDocId] = useState<string | null>(null);

  const accountsCollectionRef = collection(db, "accounts");

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const accountSnapshot = await getDocs(query(accountsCollectionRef));
        if (!accountSnapshot.empty) {
          const existingDoc = accountSnapshot.docs[0];
          const docData = existingDoc.data();
          setDocId(existingDoc.id);
          setInstagram(docData.instagram || "");
          setFacebook(docData.facebook || "");
          setTwitter(docData.twitter || "");
          setTikTok(docData.tiktok || "");
          setPinterest(docData.pinterest || "");
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load social media accounts", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, []);

  const updateOrCreateAccount = async (data: any) => {
    try {
      const accountData = {
        ...data,
        updatedAt: serverTimestamp(),
        author: {
          name: auth.currentUser?.displayName,
          id: auth.currentUser?.uid,
        },
      };
      if (docId) {
        await setDoc(doc(db, "accounts", docId), accountData, { merge: true });
      } else {
        const newDocRef = await addDoc(accountsCollectionRef, {
          ...accountData,
          createdAt: serverTimestamp(),
        });
        setDocId(newDocRef.id);
      }
      return true;
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to update social media accounts", "error");
      return false;
    }
  };

  const updateSingleField = async (platform: string, value: string) => {
    if (!value) {
      Swal.fire("Warning", `Please enter a ${platform} URL`, "warning");
      return;
    }
    const success = await updateOrCreateAccount({ [platform]: value });
    if (success) Swal.fire("Success", `${platform} Updated!`, "success");
  };

  const removeField = async (platform: string, setter: any) => {
    const success = await updateOrCreateAccount({ [platform]: null });
    if (success) {
      setter("");
      Swal.fire("Removed", `${platform} Removed Successfully!`, "success");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-12 w-12 border-b-2 border-[#606C38] rounded-full"></div>
    </div>
  );

  const accounts = [
    { name: "Instagram", value: instagram, setter: setInstagram },
    { name: "Facebook", value: facebook, setter: setFacebook },
    { name: "Twitter/X", value: twitter, setter: setTwitter },
    { name: "TikTok", value: tiktok, setter: setTikTok },
    { name: "Pinterest", value: pinterest, setter: setPinterest },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#606C38] mb-4 text-center">Manage Social Media Accounts</h1>
        <p className="text-gray-600 text-center mb-8">Update or remove your social media links</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account) => (
            <div key={account.name} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#606C38] hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{account.name}</h2>
              <input
                type="text"
                placeholder={`www.${account.name.toLowerCase()}.com/...`}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#606C38] mb-4"
                value={account.value}
                onChange={(e) => account.setter(e.target.value)}
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => removeField(account.name.toLowerCase(), account.setter)}
                  className="px-4 py-2 bg-red-300 text-red-700 rounded-md hover:bg-red-400 transition-colors"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => updateSingleField(account.name.toLowerCase(), account.value)}
                  className="px-4 py-2 bg-[#606C38]/30 text-[#606C38] rounded-md hover:bg-[#606C38]/60 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => updateOrCreateAccount({ instagram, facebook, twitter, tiktok, pinterest })}
            className="px-6 py-3 bg-[#606C38] text-white rounded-md hover:bg-[#606C38]/80 transition-colors"
          >
            Update All Accounts
          </button>
          <button
            onClick={() => updateOrCreateAccount({ instagram: null, facebook: null, twitter: null, tiktok: null, pinterest: null })}
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Remove All Accounts
          </button>
        </div>
      </div>
    </div>
  );
}
