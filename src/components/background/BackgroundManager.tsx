"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase"; // pas path aan indien nodig

interface Category {
  id: string;
  name: string;
  type: "wishlist" | "event" | "web";
}

export default function BackgroundCategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<"wishlist" | "event" | "web">("wishlist");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const categoriesCollectionRef = collection(db, "backgroundCategories");

  // Real-time listener
  useEffect(() => {
    const unsubscribe = onSnapshot(
      categoriesCollectionRef,
      (snapshot) => {
        const categoryList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Category, "id">),
        }));
        setCategories(categoryList);
      },
      (error) => {
        console.error("Error listening to categories:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return alert("Please enter a category name.");

    try {
      await addDoc(categoriesCollectionRef, {
        name: newCategoryName,
        type: categoryType,
      });
      setNewCategoryName("");
      setIsAddingCategory(false);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, "backgroundCategories", id));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-warm-olive mb-2">Manage Background Categories</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {["wishlist", "event"].map((type) => (
          <div key={type}>
            <h3 className="text-lg font-semibold mb-2">{type.charAt(0).toUpperCase() + type.slice(1)} Categories</h3>
            <ul className="space-y-2">
              {categories
                .filter((cat) => cat.type === type)
                .map((category) => (
                  <li key={category.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                    <span>{category.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-[#b34c4c] hover:text-[#b34c4c]"
                    >
                      Delete
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {isAddingCategory ? (
        <div className="bg-white p-4 shadow-md rounded-lg">
          <h3 className="font-medium mb-3">Add New Category</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter category name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category Type</label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value as "wishlist" | "event" | "web")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="wishlist">Wishlist</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button onClick={handleAddCategory} className="px-4 py-2 bg-[#606C38] text-white rounded-md hover:bg-[#434c26]">
                Save Category
              </button>
              <button onClick={() => setIsAddingCategory(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingCategory(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add New Category
        </button>
      )}
    </div>
  );
}
