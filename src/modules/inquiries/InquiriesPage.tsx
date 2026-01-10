// src/modules/inquiries/InquiriesPage.tsx
import { getInquiries, getInquiryStats } from './inquiries.server';
import { InquiriesTable } from './InquiriesTable';
import { InquiryWithUser, InquiryStats } from './inquiries.types';

export default async function InquiriesPage() {
  const pageLimit = 10;

  // ===================================================================
  // Initial server fetch - server-first flow
  // ===================================================================
  const { inquiries, lastDoc } = await getInquiries({ page: 1, pageLimit });
  const stats: InquiryStats = await getInquiryStats();

  return (
    <div className="p-6 max-w-full">
      <h1 className="text-2xl font-bold mb-4">Customer Inquiries</h1>

      {/* Initial stats display */}
      <div className="flex gap-4 mb-6">
        <p>Total: {stats.total}</p>
        <p>Resolved: {stats.resolved}</p>
        <p>Pending: {stats.pending}</p>
      </div>

      {/* Client-side table handles search, filters, pagination, resolve/delete */}
      <InquiriesTable
        initialInquiries={inquiries}
        initialLastDoc={lastDoc}
        pageLimit={pageLimit}
        initialStats={stats}
      />
    </div>
  );
}
