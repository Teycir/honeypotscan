'use client';

import { motion } from 'framer-motion';

export type ScanTab = 'address' | 'code';

interface TabNavigationProps {
  activeTab: ScanTab;
  onTabChange: (tab: ScanTab) => void;
}

const TABS: { id: ScanTab; label: string }[] = [
  { id: 'address', label: 'Scan Address' },
  { id: 'code', label: 'Paste Code' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const handleClick = (tabId: ScanTab) => {
    onTabChange(tabId);
  };

  return (
    <div className="flex mb-4 bg-gray-900/50 rounded-lg p-1" role="tablist">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleClick(tab.id)}
            className={`relative flex-1 py-2.5 px-4 text-sm font-medium transition-all duration-200 rounded-md ${
              isActive
                ? 'text-white bg-blue-600'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
