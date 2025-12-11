import 'server-only';

import { adminDb } from '@/lib/server/firebase-admin';
import type { Inquiry, InquiryWithUser, InquiryStats } from '@/types/inquiry';

// ============================================================================
// GET INQUIRIES WITH PAGINATION
// ============================================================================

export async function getInquiries(params: {
  limit?: number;
  startAfter?: string;
}): Promise<InquiryWithUser[]> {
  try {
    const { limit = 10, startAfter } = params;

    let query = adminDb
      .collection('inquiries')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startAfter) {
      const lastDoc = await adminDb.collection('inquiries').doc(startAfter).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();

    // Fetch inquiries with user data
    const inquiries = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Fetch user data
        let user = null;
        if (data.uid) {
          const userDoc = await adminDb.collection('users').doc(data.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            user = {
              id: userDoc.id,
              email: userData?.email || '',
              photoURL: userData?.photoURL || '',
              name: `${userData?.firstName || 'Unknown'} ${userData?.lastName || 'User'}`,
              firstName: userData?.firstName,
              lastName: userData?.lastName,
            };
          }
        }

        return {
          id: doc.id,
          uid: data.uid || '',
          email: data.email || '',
          message: data.message || '',
          inquiryType: data.inquiryType || 'other',
          isResolved: data.isResolved || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
          user,
        } as InquiryWithUser;
      })
    );

    return inquiries;
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return [];
  }
}

// ============================================================================
// GET INQUIRY STATISTICS
// ============================================================================

export async function getInquiryStats(): Promise<InquiryStats> {
  try {
    const inquiriesRef = adminDb.collection('inquiries');

    // Get total count
    const totalSnapshot = await inquiriesRef.count().get();
    const total = totalSnapshot.data().count;

    // Get resolved count
    const resolvedSnapshot = await inquiriesRef
      .where('isResolved', '==', true)
      .count()
      .get();
    const resolved = resolvedSnapshot.data().count;

    return {
      total,
      resolved,
      pending: total - resolved,
    };
  } catch (error) {
    console.error('Error fetching inquiry stats:', error);
    return { total: 0, resolved: 0, pending: 0 };
  }
}

// ============================================================================
// GET UNIQUE INQUIRY TYPES
// ============================================================================

export async function getUniqueInquiryTypes(): Promise<string[]> {
  try {
    const snapshot = await adminDb.collection('inquiries').get();
    
    const types = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const inquiryType = doc.data().inquiryType;
      if (inquiryType) {
        types.add(inquiryType);
      }
    });

    return Array.from(types);
  } catch (error) {
    console.error('Error fetching inquiry types:', error);
    return [];
  }
}