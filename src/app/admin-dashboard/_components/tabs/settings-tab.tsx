'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { AffiliateStats } from '@/types/affiliate';

// Sub-components
import { AffiliateStoresStats } from './settings/affiliate-stores-stats';

// ============================================================================
// TYPES
// ============================================================================

type Props = {
  subTab: string;
  affiliateStats?: AffiliateStats | null;
};

const SUB_TABS = [
  { id: 'affiliate-stores', label: 'Affiliate Stores' },
  { id: 'general', label: 'Algemene Instellingen' },
  { id: 'email', label: 'Email Templates' },
] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SettingsTab({ subTab, affiliateStats }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState(subTab || 'affiliate-stores');

  // Sync with URL
  useEffect(() => {
    const urlSubTab = searchParams.get('subTab');
    if (urlSubTab) {
      setActiveSubTab(urlSubTab);
    }
  }, [searchParams]);

  // Navigate to sub-tab
  const navigateToSubTab = (subTabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'settings');
    params.set('subTab', subTabId);
    router.push(`/admin-dashboard?${params.toString()}`);
  };

  // Render sub-tab content
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'affiliate-stores':
        return affiliateStats ? (
          <AffiliateStoresStats stats={affiliateStats} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            Statistieken laden...
          </div>
        );
      case 'general':
        return <GeneralSettings />;
      case 'email':
        return <EmailTemplates />;
      default:
        return affiliateStats ? (
          <AffiliateStoresStats stats={affiliateStats} />
        ) : null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-4">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigateToSubTab(tab.id)}
              className={cn(
                'px-4 py-2 font-medium transition-colors border-b-2',
                activeSubTab === tab.id
                  ? 'text-accent border-accent'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab Content */}
      <div>{renderSubTabContent()}</div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS (Placeholders)
// ============================================================================

function GeneralSettings() {
  return (
    <div className="bg-white p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Algemene Instellingen</h3>
      <p className="text-gray-600">Algemene instellingen komen hier...</p>
    </div>
  );
}

function EmailTemplates() {
  return (
    <div className="bg-white p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Email Templates</h3>
      <p className="text-gray-600">Email template beheer komt hier...</p>
    </div>
  );
}