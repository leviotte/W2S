// src/app/api/account/remove/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { removeFieldAction } from '@/lib/server/actions/account-actions';
import { z } from 'zod';

/* ==========================
   VALIDATION SCHEMA
========================== */
const removeSchema = z.object({
  field: z.enum(['instagram', 'facebook', 'twitter', 'tiktok', 'pinterest']),
});

/* ==========================
   POST HANDLER
========================== */
export async function POST(req: NextRequest) {
  try {
    // 🔹 Haal session op via NextAuth
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔹 Parse request body
    const body = await req.json();
    const { field } = removeSchema.parse(body);

    // 🔹 Voer actie uit
    const account = await removeFieldAction(userId, field);

    return NextResponse.json({ success: true, account });
  } catch (err: any) {
    console.error('[API] /account/remove error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
