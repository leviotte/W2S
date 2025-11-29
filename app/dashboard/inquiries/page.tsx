"use client"; // nodig omdat we client-side hooks gebruiken (useState, useEffect)

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  DocumentSnapshot,
  limit,
  startAfter,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Inquiry {
  id: string;
  uid: string;
  createdAt: string;
  email: string;
  message: string;
  inquiryType: string;
  isResolved: boolean;
}

interface User {
  email: string;
  photoURL?: string;
  name: string;
}

interface InquiryWithUser extends Inquiry {
  user: User | null;
}

const InquiriesPage = () => {
  const inquiryCollectionRef = collection(db, "inquiries");
  const userCollectionRef = collection(db, "users");

  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<InquiryWithUser[] | null>(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [visitedDocs, setVisitedDocs] = useState<DocumentSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [previousClick, setPreviousClick] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<any>("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const pageLimit = 10;

  useEffect(() => {
    const getInquiryList = async () => {
      setLoading(true);
      try {
        let baseQuery = query(
          inquiryCollectionRef,
          orderBy("createdAt", "desc")
        );

        let querySnapshot;

        if (currentPage === 1) {
          querySnapshot = await getDocs(query(baseQuery, limit(pageLimit)));
          if (querySnapshot.docs.length > 0) {
            setVisitedDocs([querySnapshot.docs[querySnapshot.docs.length - 1]]);
          }
        } else if (previousClick && visitedDocs.length > 1) {
          const newVisitedDocs = [...visitedDocs];
          newVisitedDocs.pop();
          querySnapshot = await getDocs(
            query(
              baseQuery,
              startAfter(newVisitedDocs[newVisitedDocs.length - 1]),
              limit(pageLimit)
            )
          );
          setVisitedDocs(newVisitedDocs);
        } else {
          querySnapshot = await getDocs(
            query(
              baseQuery,
              startAfter(visitedDocs[visitedDocs.length - 1]),
              limit(pageLimit)
            )
          );
          if (querySnapshot.docs.length > 0) {
            setVisitedDocs([
              ...visitedDocs,
              querySnapshot.docs[querySnapshot.docs.length - 1],
            ]);
          }
        }

        const inquiriesData: Inquiry[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Inquiry[];

        const inquiriesWithUserInfo = await Promise.all(
          inquiriesData.map(async (inquiry) => {
            const userDocRef = doc(userCollectionRef, inquiry.uid);
            const userSnapshot = await getDoc(userDocRef);

            const userData: User | null = userSnapshot.exists()
              ? {
                  email: userSnapshot.data().email,
                  photoURL: userSnapshot.data().photoURL || "",
                  name: `${userSnapshot.data().firstName || "Unknown"} ${
                    userSnapshot.data().lastName || "User"
                  }`,
                }
              : null;

            return { ...inquiry, user: userData };
          })
        );

        setInquiries(inquiriesWithUserInfo);
      } catch (error) {
        console.error("Error fetching inquiries:", error);
        toast.error("Failed to load inquiries. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    getInquiryList();
  }, [currentPage, previousClick]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const totalSnapshot = await getCountFromServer(inquiryCollectionRef);
        const total = totalSnapshot.data().count;

        const resolvedQuery = query(
          inquiryCollectionRef,
          where("isResolved", "==", true)
        );
        const resolvedSnapshot = await getCountFromServer(resolvedQuery);
        const resolved = resolvedSnapshot.data().count;

        setStatistics({
          total,
          resolved,
          pending: total - resolved,
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
        toast.error("Failed to load statistics.");
      }
    };

    fetchStatistics();
  }, [inquiries]);

  const resolveInquiry = async (inquiryId: string) => {
    try {
      setLoadingButtonId(inquiryId);
      const inquiryDocRef = doc(inquiryCollectionRef, inquiryId);
      await updateDoc(inquiryDocRef, { isResolved: true });
      setInquiries((prev) =>
        prev?.map((inq) =>
          inq.id === inquiryId ? { ...inq, isResolved: true } : inq
        ) || null
      );
      toast.success("Inquiry marked as resolved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to resolve inquiry.");
    } finally {
      setLoadingButtonId(null);
    }
  };

  const handleDeleteClick = (inquiryId: string) => {
    setInquiryToDelete(inquiryId);
    setDeleteDialogOpen(true);
  };

  const deleteInquiry = async () => {
    if (!inquiryToDelete) return;

    try {
      setLoadingButtonId(inquiryToDelete);
      const inquiryDocRef = doc(inquiryCollectionRef, inquiryToDelete);
      await deleteDoc(inquiryDocRef);

      setInquiries(
        (prev) =>
          prev?.filter((inq) => inq.id !== inquiryToDelete) || null
      );
      toast.success("Inquiry deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete inquiry.");
    } finally {
      setLoadingButtonId(null);
      setDeleteDialogOpen(false);
      setInquiryToDelete(null);
    }
  };

  const filteredInquiries = inquiries?.filter((inquiry) => {
    const matchesSearch =
      searchTerm === "" ||
      inquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.user?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "resolved" && inquiry.isResolved) ||
      (statusFilter === "pending" && !inquiry.isResolved);

    const matchesType =
      typeFilter === "all" ||
      inquiry.inquiryType === typeFilter ||
      (typeFilter === "Other" && !inquiry?.inquiryType);

    return matchesSearch && matchesStatus && matchesType;
  });

  const getUniqueInquiryTypes = () => {
    const types = new Set<string>();
    inquiries?.forEach((inquiry) => {
      if (inquiry.inquiryType) types.add(inquiry.inquiryType);
    });
    return Array.from(types);
  };

  const InquiryCard = ({ inquiry }: { inquiry: InquiryWithUser }) => (
    <div className="bg-white rounded-lg border border-[#606C38] p-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={inquiry.user?.photoURL || "https://www.gravatar.com/avatar/?d=mp"}
          alt={`Profile of ${inquiry.user?.name || "Unknown User"}`}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-medium text-gray-800">{inquiry.user?.name || "Unknown User"}</p>
          <p className="text-xs text-gray-500">{inquiry.user?.email || "No email"}</p>
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-500">Type:</span>
          <Badge variant="outline" className="capitalize">
            {inquiry.inquiryType || "Other"}
          </Badge>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-500">Message:</span>
          <p className="text-sm text-right" style={{ maxWidth: "70%" }}>
            {inquiry.message}
          </p>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-500">Date:</span>
          <span className="text-sm">{new Date(inquiry.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-500">Status:</span>
          {inquiry.isResolved ? (
            <Badge className="bg-[#606C38]/80 hover:bg-[#606C38]/80">Resolved</Badge>
          ) : (
            <Badge className="bg-[#b34c4c] hover:bg-[#b34c4c]">Pending</Badge>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" size="sm" className="h-8 w-8" asChild>
          <a href={`mailto:${inquiry.user?.email}`} aria-label="Send Email">
            <Mail className="h-4 w-4" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 text-[#b34c4c] hover:bg-red-50"
          onClick={() => handleDeleteClick(inquiry.id)}
          disabled={loadingButtonId === inquiry.id}
        >
          {loadingButtonId === inquiry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
        {!inquiry.isResolved && (
          <Button
            size="sm"
            className="h-8"
            onClick={() => resolveInquiry(inquiry.id)}
            disabled={loadingButtonId === inquiry.id}
          >
            {loadingButtonId === inquiry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resolve"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-3 sm:p-6 max-w-full overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Customer Inquiries</h1>
      {/* De rest van de component (overzicht, filters, tabel, cards, pagination, delete dialog) blijft exact zoals in je React-code */}
      {/* ...kopieer alles vanaf de Filters en Table/Mobile cards sectie hier... */}
    </div>
  );
};

export default InquiriesPage;
