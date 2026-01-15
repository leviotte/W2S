// src/app/admin/inquiries/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { getInquiries, getInquiryStats, getUniqueInquiryTypes } from '@/lib/server/data/inquiries';
import { InquiriesManager } from './_components/inquiries-manager';

export const metadata = {
  title: 'Inquiries Beheer | Wish2Share',
  description: 'Beheer customer inquiries',
};

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
};

export default async function AdminInquiriesPage({ searchParams }: Props) {
  // 🔹 Haal session op via NextAuth
  const session = await getServerSession(authOptions);
  const sessionUserRaw = session?.user ?? null;

  // 🔹 Map session → user object voor admin-check
  const user = sessionUserRaw
    ? {
        isLoggedIn: true,
        id: sessionUserRaw.id,
        email: sessionUserRaw.email ?? '',
        displayName: sessionUserRaw.name ?? sessionUserRaw.email?.split('@')[0] ?? '',
        isAdmin: sessionUserRaw.role === 'admin',
        isPartner: sessionUserRaw.role === 'partner',
        firstName: undefined,
        lastName: undefined,
        photoURL: sessionUserRaw.image ?? null,
        username: undefined,
        createdAt: undefined,
        lastActivity: undefined,
      }
    : null;

  // 🔹 Redirect naar homepage als niet admin
  if (!user || !user.isAdmin) redirect('/');

  // 🔹 Pagina en limit uit query params
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '10');

  // 🔹 Ophalen van inquiries data
  const [inquiries, stats, inquiryTypes] = await Promise.all([
    getInquiries({ limit }),
    getInquiryStats(),
    getUniqueInquiryTypes(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <InquiriesManager
        initialInquiries={inquiries}
        stats={stats}
        inquiryTypes={inquiryTypes}
        currentPage={page}
      />
    </div>
  );
}
