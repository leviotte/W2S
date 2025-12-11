'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
import type { UserProfile } from '@/types/user';
import type { MetricsData } from '@/lib/server/data/metrics';
import type { BackgroundImage, BackgroundCategory } from '@/types/background';
import type { AffiliateStats } from '@/types/affiliate'; // ✅ ADD

// Tab Components
import { MetricsTab } from './tabs/metrics-tab';
import { BackgroundsTab } from './tabs/backgrounds-tab';
import { SettingsTab } from './tabs/settings-tab';
import { BlogTab } from './tabs/blog-tab';
import { AccountsTab } from './tabs/accounts-tab';
import { InquiriesTab } from './tabs/inquiries-tab';

// ============================================================================
// TYPES
// ============================================================================

type Props = {
  currentUser: UserProfile & { id: string };
  initialTab: string;
  initialSubTab: string;
  metricsData: MetricsData | null;
  backgroundsData: {
    images: BackgroundImage[];
    categories: BackgroundCategory[];
  } | null;
  affiliateStats: AffiliateStats | null; // ✅ ADD
};

const TABS = [
  { id: 'metrics', label: 'Metrics', subTab: null },
  { id: 'backgrounds', label: 'Backgrounds', subTab: 'web' },
  { id: 'settings', label: 'Settings', subTab: 'affiliate-stores' },
  { id: 'blogs', label: 'Blog', subTab: null },
  { id: 'accounts', label: 'Manage Social Accounts', subTab: null },
  { id: 'inquiries', label: 'Inquiries', subTab: null },
] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AdminDashboardClient({ 
  currentUser, 
  initialTab, 
  initialSubTab,
  metricsData,
  backgroundsData,
  affiliateStats, // ✅ ADD
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);
  
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Sync with URL params
  useEffect(() => {
    const tab = searchParams.get('tab') || 'metrics';
    const subTab = searchParams.get('subTab') || '';
    setActiveTab(tab);
    setActiveSubTab(subTab);
  }, [searchParams]);

  // Check arrow visibility
  useEffect(() => {
    const checkArrows = () => {
      if (tabsRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = tabsRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
      }
    };

    checkArrows();
    window.addEventListener('resize', checkArrows);
    return () => window.removeEventListener('resize', checkArrows);
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Handle scroll events
  const handleScroll = () => {
    if (tabsRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = tabsRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  // Scroll tabs
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      const newScrollLeft =
        direction === 'left'
          ? tabsRef.current.scrollLeft - scrollAmount
          : tabsRef.current.scrollLeft + scrollAmount;

      tabsRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  // Navigate to tab
  const navigateToTab = (tabId: string, subTab: string | null = null) => {
    const params = new URLSearchParams();
    params.set('tab', tabId);
    if (subTab) {
      params.set('subTab', subTab);
    }
    router.push(`/admin-dashboard?${params.toString()}`);
  };

  // ============================================================================
  // RENDER TAB CONTENT
  // ============================================================================

  const renderTabContent = () => {
    switch (activeTab) {
      case 'metrics':
        return metricsData ? (
          <MetricsTab data={metricsData} />
        ) : (
          <LoadingState message="Metrics laden..." />
        );

      case 'backgrounds':
        return backgroundsData ? (
          <BackgroundsTab 
            subTab={activeSubTab}
            initialImages={backgroundsData.images}
            initialCategories={backgroundsData.categories}
          />
        ) : (
          <LoadingState message="Achtergronden laden..." />
        );

      case 'settings':
        // ✅ UPDATE THIS
        return (
          <SettingsTab 
            subTab={activeSubTab}
            affiliateStats={affiliateStats}
          />
        );

      case 'blogs':
        return <BlogTab />;

      case 'accounts':
        return <AccountsTab />;

      case 'inquiries':
        return <InquiriesTab />;

      default:
        return metricsData ? (
          <MetricsTab data={metricsData} />
        ) : (
          <LoadingState message="Laden..." />
        );
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welkom terug, {currentUser.firstName || currentUser.displayName}
          </p>
        </div>

        {/* Tabs with Scroll Indicators */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scrollTabs('left')}
            className={cn(
              'absolute left-[-10px] top-1/2 -translate-y-1/2 z-10',
              'bg-white rounded-full shadow-md p-1',
              'flex items-center justify-center',
              'transition-opacity duration-200',
              showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="h-5 w-5 text-accent" />
          </button>

          {/* Tabs Container */}
          <div
            className="overflow-x-auto scrollbar-hide relative"
            ref={tabsRef}
            onScroll={handleScroll}
          >
            <div className="flex min-w-max space-x-4 border-b border-gray-200 px-6">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigateToTab(tab.id, tab.subTab)}
                  className={cn(
                    'px-4 py-2 whitespace-nowrap font-medium transition-colors',
                    activeTab === tab.id
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scrollTabs('right')}
            className={cn(
              'absolute right-[-10px] top-1/2 -translate-y-1/2 z-10',
              'bg-white rounded-full shadow-md p-1',
              'flex items-center justify-center',
              'transition-opacity duration-200',
              showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="h-5 w-5 text-accent" />
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingState({ message = 'Laden...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}