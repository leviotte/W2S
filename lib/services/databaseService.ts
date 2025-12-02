// lib/services/databaseService.ts
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
  Query,
  DocumentData,
  FirestoreDataConverter,
  DocumentReference,
} from "firebase/firestore";

import { getClientFirestore } from "@/lib/firebase";

const db = getClientFirestore();

export const databaseService = {
  /**
   * Create document with server timestamp fields
   */
  async create<T extends DocumentData>(collectionName: string, id: string, data: T) {
    const ref: DocumentReference = doc(db, collectionName, id);
    await setDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref;
  },

  /**
   * Read document
   */
  async read<T>(collectionName: string, id: string): Promise<T | null> {
    const ref = doc(db, collectionName, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as T;
  },

  /**
   * Update document + update timestamp
   */
  async update<T extends DocumentData>(collectionName: string, id: string, data: Partial<T>) {
    const ref = doc(db, collectionName, id);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return ref;
  },

  /**
   * Delete document
   */
  async delete(collectionName: string, id: string) {
    const ref = doc(db, collectionName, id);
    await deleteDoc(ref);
    return true;
  },

  /**
   * Run Firestore query and return typed result
   */
  async query<T extends DocumentData>(q: Query<T>): Promise<(T & { id: string })[]> {
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as T),
    }));
  },

  /**
   * Converter helper for strictly typed collections
   */
  withConverter<T>(converter: FirestoreDataConverter<T>) {
    return {
      collection: (name: string) => collection(db, name).withConverter(converter),
      doc: (name: string, id: string) => doc(db, name, id).withConverter(converter),
    };
  },
};
