'use server';
import 'server-only';
import { adminDb } from '@/lib/server/firebase-admin'; // jouw Admin SDK wrapper
import { DocumentSnapshot } from 'firebase-admin/firestore';
import { Inquiry, InquiryWithUser, InquiryStats, InquiryFilters } from './inquiries.types';

// ============================================================================
// FETCH INQUIRIES
// ============================================================================

interface GetInquiriesParams {
  page: number;
  pageLimit: number;
  lastDocId?: string;
  filters?: InquiryFilters;
}

export async function getInquiries({ page, pageLimit, lastDocId, filters }: GetInquiriesParams): Promise<{ inquiries: InquiryWithUser[], lastDoc?: DocumentSnapshot }> {
  const inquiriesRef = adminDb.collection('inquiries');
  let q: FirebaseFirestore.Query = inquiriesRef.orderBy('createdAt', 'desc');

  if (filters?.status === 'resolved') q = q.where('isResolved', '==', true);
  if (filters?.status === 'pending') q = q.where('isResolved', '==', false);
  if (filters?.type && filters.type !== 'all') q = q.where('inquiryType', '==', filters.type);

  if (lastDocId) {
    const lastDocSnapshot = await inquiriesRef.doc(lastDocId).get();
    if (lastDocSnapshot.exists) q = q.startAfter(lastDocSnapshot);
  }

  q = q.limit(pageLimit);

  const snapshot = await q.get();
  const inquiriesData = await Promise.all(snapshot.docs.map(async (docSnap) => {
    const data = docSnap.data() as Inquiry;
    const userSnap = await adminDb.collection('users').doc(data.uid).get();
    const user = userSnap.exists ? {
      email: userSnap.data()?.email,
      photoURL: userSnap.data()?.photoURL || undefined,
      firstName: userSnap.data()?.firstName || undefined,
      lastName: userSnap.data()?.lastName || undefined,
    } : null;

    return { ...data, id: docSnap.id, user };
  }));

  return {
    inquiries: inquiriesData,
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
  };
}

// ============================================================================
// FETCH STATISTICS
// ============================================================================

export async function getInquiryStats(): Promise<InquiryStats> {
  const inquiriesRef = adminDb.collection('inquiries');

 const totalQuery = inquiriesRef.count();
const resolvedQuery = inquiriesRef.where('isResolved', '==', true).count();

const [totalSnap, resolvedSnap] = await Promise.all([totalQuery.get(), resolvedQuery.get()]);

return {
  total: totalSnap.data().count,
  resolved: resolvedSnap.data().count,
  pending: totalSnap.data().count - resolvedSnap.data().count,
};
}


// ============================================================================
// RESOLVE INQUIRY
// ============================================================================

export async function resolveInquiry(inquiryId: string) {
  const docRef = adminDb.collection('inquiries').doc(inquiryId);
  await docRef.update({ isResolved: true });
  return { success: true };
}

// ============================================================================
// DELETE INQUIRY
// ============================================================================

export async function deleteInquiry(inquiryId: string) {
  const docRef = adminDb.collection('inquiries').doc(inquiryId);
  await docRef.delete();
  return { success: true };
}
