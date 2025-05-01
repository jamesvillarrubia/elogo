'use client';

import { useState, useEffect } from 'react';
import LogoComparison from '@/components/LogoComparison';
import Leaderboard from '@/components/Leaderboard';
import { Logo, LogoPair, LeaderboardEntry } from '@/types';
import { hasBeenCompared } from '@/lib/cookies';
import { logEnvironmentVariables } from '@/lib/env';

export default function Home() {
  const [logoPair, setLogoPair] = useState<LogoPair | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allVoted, setAllVoted] = useState(false);
  const [designBrief, setDesignBrief] = useState<string>('');

  const fetchRandomPair = async () => {
    try {
      const response = await fetch('/api/logos/random-pair');
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 400 && data.allComparisonsComplete) {
          setAllVoted(true);
          setLogoPair(null);
          return true;
        }
        throw new Error(data.error || 'Failed to fetch logo pair');
      }
      
      setLogoPair(data);
      setAllVoted(false);
      return true;
    } catch (err) {
      console.error('Error in fetchRandomPair:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/logos/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setLeaderboard(data);
      return true;
    } catch (err) {
      console.error('Error in fetchLeaderboard:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  const handleVote = async (winnerId: string, loserId: string) => {
    try {
      const response = await fetch('/api/logos/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winnerId, loserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      await Promise.all([fetchRandomPair(), fetchLeaderboard()]);
    } catch (err) {
      console.error('Error in handleVote:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch design brief
        const briefResponse = await fetch('/api/design-brief');
        if (briefResponse.ok) {
          const briefData = await briefResponse.json();
          setDesignBrief(briefData.designBrief);
        }

        // Fetch initial pair
        const pairResponse = await fetch('/api/logos/random-pair');
        const pairData = await pairResponse.json();
        
        if (!pairResponse.ok) {
          if (pairResponse.status === 400 && pairData.allComparisonsComplete) {
            setAllVoted(true);
            setLogoPair(null);
          } else {
            throw new Error(pairData.error || 'Failed to fetch logo pair');
          }
        } else {
          setLogoPair(pairData);
          setAllVoted(false);
        }

        // Fetch leaderboard
        const leaderboardResponse = await fetch('/api/logos/leaderboard');
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          setLeaderboard(leaderboardData);
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8">Logo ELO Ranking System</h1>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Logo ELO Ranking System
        </h1>
        
        {error ? (
          <div className="text-red-600 text-center mb-8 p-4 bg-red-50 rounded-lg">
            {error}
          </div>
        ) : null}
        
        <div className="mb-12">
          <LogoComparison
            logoPair={logoPair}
            onVote={handleVote}
            allVoted={allVoted}
            designBrief={designBrief}
          />
        </div>
        
        <div className="mt-12">
          <Leaderboard entries={leaderboard} />
        </div>
      </div>
    </main>
  );
}
