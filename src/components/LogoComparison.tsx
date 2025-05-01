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
    setSelectedLogo(logoId === selectedLogo ? null : logoId);
  };

  const handleVote = () => {
    if (!selectedLogo || !logoPair || isTransitioning) return;
    
    const winnerId = selectedLogo;
    const loserId = selectedLogo === logoPair.logo1.id ? logoPair.logo2.id : logoPair.logo1.id;
    
    setIsTransitioning(true);
    updateVoteHistory(winnerId, loserId);
    
    setTimeout(() => {
      onVote(winnerId, loserId);
    }, 500);
  };

  if (!logoPair && !allVoted) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      {allVoted ? (
        <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900">All Comparisons Complete! 🎉</h2>
          <p className="text-gray-600 text-center max-w-md">
            You've voted on all possible logo combinations. Check out the leaderboard below to see the results!
          </p>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/logos/clear-cookies', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });

                if (!response.ok) {
                  throw new Error('Failed to clear history');
                }

                clearCookies();
              } catch (error) {
                clearCookies();
              }
            }}
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 transform hover:scale-105"
          >
            Start Fresh Round
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex flex-col items-center space-y-4">
              <button 
                onClick={() => handleLogoClick(logoPair!.logo1.id)}
                className={`w-64 h-64 flex items-center justify-center bg-gray-50 rounded-lg p-4 transition-all duration-200 ${
                  selectedLogo === logoPair!.logo1.id ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
                }`}
              >
                <img
                  src={logoPair!.logo1.url}
                  alt={logoPair!.logo1.name}
                  className="max-w-[200px] max-h-[200px] object-contain"
                />
              </button>
              <div className="text-lg font-medium text-gray-900">{logoPair!.logo1.name}</div>
            </div>

            <div className="text-xl font-bold text-gray-500">VS</div>

            <div className="flex flex-col items-center space-y-4">
              <button 
                onClick={() => handleLogoClick(logoPair!.logo2.id)}
                className={`w-64 h-64 flex items-center justify-center bg-gray-50 rounded-lg p-4 transition-all duration-200 ${
                  selectedLogo === logoPair!.logo2.id ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
                }`}
              >
                <img
                  src={logoPair!.logo2.url}
                  alt={logoPair!.logo2.name}
                  className="max-w-[200px] max-h-[200px] object-contain"
                />
              </button>
              <div className="text-lg font-medium text-gray-900">{logoPair!.logo2.name}</div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleVote}
              disabled={!selectedLogo || isTransitioning}
              className={`px-8 py-3 rounded-lg transition-all duration-200 ${
                selectedLogo
                  ? 'bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-105'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {selectedLogo ? `Vote for ${selectedLogo === logoPair!.logo1.id ? logoPair!.logo1.name : logoPair!.logo2.name}` : 'Select a logo to vote'}
            </button>
          </div>
        </>
      )}

      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">Design Brief</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden p-6">
          <div className="prose max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-6" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-4" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-bold mb-3" {...props} />,
                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                li: ({ node, ...props }) => <li className="mb-2" {...props} />,
              }}
            >
              {designBrief}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
} 