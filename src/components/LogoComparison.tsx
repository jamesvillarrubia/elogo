'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Logo, LogoPair } from '@/types';
import { hasBeenCompared, updateVoteHistory, clearCookies } from '@/lib/cookies';
import { calculateNewRatings } from '@/lib/elo';
import ReactMarkdown from 'react-markdown';

interface LogoComparisonProps {
  logoPair: LogoPair | null;
  onVote: (winnerId: string, loserId: string) => void;
  allVoted: boolean;
  designBrief: string;
}

export default function LogoComparison({ logoPair, onVote, allVoted, designBrief }: LogoComparisonProps) {
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setSelectedLogo(null);
    setIsTransitioning(false);
  }, [logoPair]);

  const handleLogoClick = (logoId: string) => {
    if (isTransitioning || allVoted) return;
    setSelectedLogo(logoId);
  };

  const handleVote = (winnerId: string, loserId: string) => {
    if (allVoted || !logoPair) return;
    
    setIsTransitioning(true);
    
    // Update vote history
    updateVoteHistory(winnerId, loserId);
    
    // Call parent handler after animation
    setTimeout(() => {
      onVote(winnerId, loserId);
    }, 500);
  };

  if (!logoPair && !allVoted) {
    console.log('LogoComparison: No logo pair and not all voted, returning null');
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      {allVoted ? (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <h2 className="text-2xl font-bold text-gray-900">All Comparisons Complete!</h2>
          <p className="text-gray-600">You've voted on all possible logo combinations.</p>
          <button
            onClick={async () => {
              try {
                console.log('LogoComparison: Clearing history...');
                const response = await fetch('/api/logos/clear-cookies', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });

                if (!response.ok) {
                  console.error('LogoComparison: Failed to clear cookies via API');
                  throw new Error('Failed to clear history');
                }

                console.log('LogoComparison: History cleared successfully');
                clearCookies(); // This will also reload the page
              } catch (error) {
                console.error('LogoComparison: Error clearing history:', error);
                // Fallback to client-side clearing
                clearCookies();
              }
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Clear History & Start Over
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-64 h-64 flex items-center justify-center bg-gray-50 rounded-lg p-4">
              <img
                src={logoPair!.logo1.url}
                alt={logoPair!.logo1.name}
                className="max-w-[200px] max-h-[200px] object-contain"
              />
            </div>
            <button
              onClick={() => handleVote(logoPair!.logo1.id, logoPair!.logo2.id)}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Vote for {logoPair!.logo1.name}
            </button>
          </div>

          <div className="text-xl font-bold text-gray-500">VS</div>

          <div className="flex flex-col items-center space-y-4">
            <div className="w-64 h-64 flex items-center justify-center bg-gray-50 rounded-lg p-4">
              <img
                src={logoPair!.logo2.url}
                alt={logoPair!.logo2.name}
                className="max-w-[200px] max-h-[200px] object-contain"
              />
            </div>
            <button
              onClick={() => handleVote(logoPair!.logo2.id, logoPair!.logo1.id)}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Vote for {logoPair!.logo2.name}
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">Design Brief</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden p-6">
          <div className="prose max-w-none">
            <ReactMarkdown>{designBrief}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
} 