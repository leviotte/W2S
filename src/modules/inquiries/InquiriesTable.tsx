'use client';
import { useState, useTransition } from 'react';
import { InquiryWithUser, InquiryStats, InquiryFilters } from './inquiries.types';
import { getInquiries, getInquiryStats, resolveInquiry, deleteInquiry } from './inquiries.server';
import { toast } from 'sonner';
import { Loader2, Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface InquiriesTableProps {
  initialInquiries: InquiryWithUser[];
  initialLastDoc?: any;
  pageLimit: number;
  initialStats: InquiryStats;
}

export function InquiriesTable({ initialInquiries, initialLastDoc, pageLimit, initialStats }: InquiriesTableProps) {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [lastDoc, setLastDoc] = useState(initialLastDoc);
  const [stats, setStats] = useState(initialStats);
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<InquiryFilters>({});
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');

  // ===========================================================
  // Pagination & filters
  // ===========================================================
  const loadPage = (newPage: number) => {
    startTransition(async () => {
      try {
        const { inquiries: newInquiries, lastDoc: newLastDoc } = await getInquiries({
          page: newPage,
          pageLimit,
          lastDocId: lastDoc?.id,
          filters,
        });
        setInquiries(newInquiries);
        setLastDoc(newLastDoc);
        setPage(newPage);
      } catch (e: any) {
        toast.error(e.message || 'Failed to load inquiries');
      }
    });
  };

  const handleResolve = (id: string) => {
    startTransition(async () => {
      try {
        setLoadingButtonId(id);
        await resolveInquiry(id);
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === id ? { ...inq, isResolved: true } : inq))
        );
        const updatedStats = await getInquiryStats();
        setStats(updatedStats);
        toast.success('Inquiry marked as resolved');
      } catch (e: any) {
        toast.error(e.message || 'Failed to resolve inquiry');
      } finally {
        setLoadingButtonId(null);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        setLoadingButtonId(id);
        await deleteInquiry(id);
        setInquiries((prev) => prev.filter((inq) => inq.id !== id));
        const updatedStats = await getInquiryStats();
        setStats(updatedStats);
        toast.success('Inquiry deleted');
      } catch (e: any) {
        toast.error(e.message || 'Failed to delete inquiry');
      } finally {
        setLoadingButtonId(null);
      }
    });
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      searchTerm === '' ||
      inquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      !filters.status ||
      filters.status === 'all' ||
      (filters.status === 'resolved' && inquiry.isResolved) ||
      (filters.status === 'pending' && !inquiry.isResolved);

    const matchesType =
      !filters.type || filters.type === 'all' || inquiry.inquiryType === filters.type;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div>
      {/* Search */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4">
        <Badge>Total: {stats.total}</Badge>
        <Badge>Resolved: {stats.resolved}</Badge>
        <Badge>Pending: {stats.pending}</Badge>
      </div>

      {/* Table / Cards */}
      {filteredInquiries.map((inq) => (
        <div key={inq.id} className="bg-white border rounded p-3 mb-2 flex justify-between items-center">
          <div>
            <p className="font-medium">{inq.user?.firstName} {inq.user?.lastName}</p>
            <p className="text-sm">{inq.message}</p>
            <p className="text-xs">{new Date(inq.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button size="sm" variant="ghost" asChild>
              <a href={`mailto:${inq.user?.email}`}><Mail /></a>
            </Button>
            {!inq.isResolved && (
              <Button size="sm" onClick={() => handleResolve(inq.id)} disabled={loadingButtonId === inq.id}>
                {loadingButtonId === inq.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Resolve'}
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={() => handleDelete(inq.id)} disabled={loadingButtonId === inq.id}>
              {loadingButtonId === inq.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 />}
            </Button>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex gap-2 mt-4">
        <Button onClick={() => loadPage(page - 1)} disabled={page === 1}>Previous</Button>
        <Button onClick={() => loadPage(page + 1)} disabled={inquiries.length < pageLimit}>Next</Button>
      </div>
    </div>
  );
}
