'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/server/firebase-admin';
import { requireAdmin } from '@/lib/auth/actions';

// ============================================================================
// TYPES
// ============================================================================

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// RESOLVE INQUIRY
// ============================================================================

export async function resolveInquiry(
  inquiryId: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await adminDb.collection('inquiries').doc(inquiryId).update({
      isResolved: true,
      updatedAt: new Date(),
    });

    revalidatePath('/admin-dashboard/inquiries');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error resolving inquiry:', error);
    return { success: false, error: 'Fout bij markeren als opgelost' };
  }
}

// ============================================================================
// DELETE INQUIRY
// ============================================================================

export async function deleteInquiry(
  inquiryId: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await adminDb.collection('inquiries').doc(inquiryId).delete();

    revalidatePath('/admin-dashboard/inquiries');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    return { success: false, error: 'Fout bij verwijderen van inquiry' };
  }
}

// ============================================================================
// BULK RESOLVE
// ============================================================================

export async function bulkResolveInquiries(
  inquiryIds: string[]
): Promise<ActionResult<{ resolved: number }>> {
  try {
    await requireAdmin();

    const batch = adminDb.batch();
    const updateData = {
      isResolved: true,
      updatedAt: new Date(),
    };

    inquiryIds.forEach((id) => {
      const docRef = adminDb.collection('inquiries').doc(id);
      batch.update(docRef, updateData);
    });

    await batch.commit();

    revalidatePath('/admin-dashboard/inquiries');

    return { success: true, data: { resolved: inquiryIds.length } };
  } catch (error) {
    console.error('Error bulk resolving inquiries:', error);
    return { success: false, error: 'Fout bij bulk markeren als opgelost' };
  }
}

// ============================================================================
// BULK DELETE
// ============================================================================

export async function bulkDeleteInquiries(
  inquiryIds: string[]
): Promise<ActionResult<{ deleted: number }>> {
  try {
    await requireAdmin();

    const batch = adminDb.batch();

    inquiryIds.forEach((id) => {
      const docRef = adminDb.collection('inquiries').doc(id);
      batch.delete(docRef);
    });

    await batch.commit();

    revalidatePath('/admin-dashboard/inquiries');

    return { success: true, data: { deleted: inquiryIds.length } };
  } catch (error) {
    console.error('Error bulk deleting inquiries:', error);
    return { success: false, error: 'Fout bij bulk verwijderen' };
  }
}