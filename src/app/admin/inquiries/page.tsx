// src/app/admin/inquiries/page.tsx
import { getServerSession } from '@/lib/auth/get-server-session';
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
  const session = await getServerSession();

  if (!session.user.isLoggedIn || !session.user.isAdmin) {
  redirect('/');
}

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '10');

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