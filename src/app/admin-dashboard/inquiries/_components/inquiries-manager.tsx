'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { resolveInquiry, deleteInquiry } from '@/lib/server/actions/inquiries';
import type { InquiryWithUser, InquiryStats, InquiryType } from '@/types/inquiry';

// ============================================================================
// TYPES
// ============================================================================

type Props = {
  initialInquiries: InquiryWithUser[];
  stats: InquiryStats;
  inquiryTypes: string[];
  currentPage: number;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InquiriesManager({
  initialInquiries,
  stats,
  inquiryTypes,
  currentPage,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'resolved' | 'pending'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | InquiryType>('all');

  // ============================================================================
  // FILTERED INQUIRIES
  // ============================================================================

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        inquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.user?.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'resolved' && inquiry.isResolved) ||
        (statusFilter === 'pending' && !inquiry.isResolved);

      // Type filter
      const matchesType =
        typeFilter === 'all' || inquiry.inquiryType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [inquiries, searchTerm, statusFilter, typeFilter]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleResolve = (inquiryId: string) => {
    setLoadingId(inquiryId);

    startTransition(async () => {
      const result = await resolveInquiry(inquiryId);

      if (result.success) {
        // Optimistically update UI
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === inquiryId ? { ...inq, isResolved: true } : inq
          )
        );
        toast.success('Inquiry gemarkeerd als opgelost');
      } else {
        toast.error(result.error);
      }

      setLoadingId(null);
    });
  };

  const handleDeleteClick = (inquiryId: string) => {
    setInquiryToDelete(inquiryId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!inquiryToDelete) return;

    setLoadingId(inquiryToDelete);

    startTransition(async () => {
      const result = await deleteInquiry(inquiryToDelete);

      if (result.success) {
        // Optimistically update UI
        setInquiries((prev) => prev.filter((inq) => inq.id !== inquiryToDelete));
        toast.success('Inquiry verwijderd');
      } else {
        toast.error(result.error);
      }

      setLoadingId(null);
      setDeleteDialogOpen(false);
      setInquiryToDelete(null);
    });
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/admin-dashboard/inquiries?page=${newPage}`);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Inquiries</h1>
        <p className="mt-2 text-gray-600">
          Beheer en beantwoord klantenvragen
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Totaal Inquiries"
          value={stats.total}
          color="blue"
        />
        <StatCard
          label="Opgelost"
          value={stats.resolved}
          color="green"
        />
        <StatCard
          label="Wachtend"
          value={stats.pending}
          color="orange"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-3">
            <Input
              placeholder="Zoek inquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="resolved">Opgelost</SelectItem>
              <SelectItem value="pending">Wachtend</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(value: any) => setTypeFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Types</SelectItem>
              {inquiryTypes.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
            }}
            disabled={searchTerm === '' && statusFilter === 'all' && typeFilter === 'all'}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Gebruiker</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead>Bericht</TableHead>
              <TableHead className="w-[160px]">Datum</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[180px] text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInquiries.length > 0 ? (
              filteredInquiries.map((inquiry) => (
                <InquiryRow
                  key={inquiry.id}
                  inquiry={inquiry}
                  onResolve={handleResolve}
                  onDelete={handleDeleteClick}
                  isLoading={loadingId === inquiry.id}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  Geen inquiries gevonden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredInquiries.length > 0 ? (
          filteredInquiries.map((inquiry) => (
            <InquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              onResolve={handleResolve}
              onDelete={handleDeleteClick}
              isLoading={loadingId === inquiry.id}
            />
          ))
        ) : (
          <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
            Geen inquiries gevonden
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Toont {filteredInquiries.length} van {stats.total} inquiries
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isPending}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Vorige
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={filteredInquiries.length < 10 || isPending}
          >
            Volgende
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan gemaakt worden. De inquiry wordt permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Stats Card
type StatCardProps = {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'orange';
};

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

// Table Row (Desktop)
type InquiryRowProps = {
  inquiry: InquiryWithUser;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
};

function InquiryRow({ inquiry, onResolve, onDelete, isLoading }: InquiryRowProps) {
  return (
    <TableRow className="hover:bg-gray-50/50">
      {/* User */}
      <TableCell>
        <div className="flex items-center gap-3">
          <img
            src={inquiry.user?.photoURL || 'https://www.gravatar.com/avatar/?d=mp'}
            alt={inquiry.user?.name || 'Unknown'}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {inquiry.user?.name || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {inquiry.user?.email || 'No email'}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Type */}
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {inquiry.inquiryType}
        </Badge>
      </TableCell>

      {/* Message */}
      <TableCell>
        <div className="max-w-[300px] truncate" title={inquiry.message}>
          {inquiry.message}
        </div>
      </TableCell>

      {/* Date */}
      <TableCell>
        <div className="text-sm text-gray-600">
          {inquiry.createdAt.toLocaleDateString('nl-BE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        {inquiry.isResolved ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Opgelost
          </Badge>
        ) : (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            Wachtend
          </Badge>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <a href={`mailto:${inquiry.user?.email}`} aria-label="Send Email">
              <Mail className="h-4 w-4" />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:bg-red-50"
            onClick={() => onDelete(inquiry.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>

          {!inquiry.isResolved && (
            <Button
              size="sm"
              className="h-8"
              onClick={() => onResolve(inquiry.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Oplossen
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// Mobile Card
type InquiryCardProps = InquiryRowProps;

function InquiryCard({ inquiry, onResolve, onDelete, isLoading }: InquiryCardProps) {
  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <img
          src={inquiry.user?.photoURL || 'https://www.gravatar.com/avatar/?d=mp'}
          alt={inquiry.user?.name || 'Unknown'}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {inquiry.user?.name || 'Unknown User'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {inquiry.user?.email || 'No email'}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Type:</span>
          <Badge variant="outline" className="capitalize">
            {inquiry.inquiryType}
          </Badge>
        </div>

        <div>
          <span className="text-gray-500">Bericht:</span>
          <p className="mt-1 text-gray-900">{inquiry.message}</p>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Datum:</span>
          <span className="text-gray-900">
            {inquiry.createdAt.toLocaleDateString('nl-BE')}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Status:</span>
          {inquiry.isResolved ? (
            <Badge className="bg-green-100 text-green-800">Opgelost</Badge>
          ) : (
            <Badge className="bg-orange-100 text-orange-800">Wachtend</Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <a href={`mailto:${inquiry.user?.email}`}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </a>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:bg-red-50"
          onClick={() => onDelete(inquiry.id)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>

        {!inquiry.isResolved && (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onResolve(inquiry.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Oplossen'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}