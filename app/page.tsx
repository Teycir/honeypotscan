'use client';

import { useState } from 'react';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { CyclingFeatures } from './components/CyclingFeatures';
import StackedTitle from './components/StackedTitle';
import { AnimatedTagline } from './components/AnimatedTagline';
import { TabNavigation, type ScanTab } from './components/TabNavigation';
import { AddressScanTab } from './components/AddressScanTab';
import { CodeScanTab } from './components/CodeScanTab';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ScanTab>('address');

  return (
    <>
      <LoadingScreen />
      <AnimatedBackground />
      <main className="min-h-screen pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <StackedTitle text="HoneypotScan" className="text-5xl sm:text-6xl font-bold text-white mb-2" />
            </div>

            <AnimatedTagline text="Check if a token is a scam before you buy" />
            <CyclingFeatures />
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-2xl">
              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
              
              <div className="transition-opacity duration-200">
                {activeTab === 'address' ? (
                  <AddressScanTab />
                ) : (
                  <CodeScanTab />
                )}
              </div>
            </div>
          </div>

        </div>
        <Footer />
      </main>
    </>
  );
}
