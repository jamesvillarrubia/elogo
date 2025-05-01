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
      console.log('Page: Fetching random pair...');
      const response = await fetch('/api/logos/random-pair');
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 400 && data.allComparisonsComplete) {
          console.log('Page: All comparisons complete, setting allVoted to true');
          setAllVoted(true);
          setLogoPair(null);
          return true;
        }
        throw new Error('Failed to fetch logo pair');
      }
      
      const data = await response.json();
      console.log('Page: Received new logo pair:', data);
      setLogoPair(data);
      setAllVoted(false);
      return true;
    } catch (err) {
      console.error('Page: Error in fetchRandomPair:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  const fetchLeaderboard = async () => {
    try {
      console.log('Page: Fetching leaderboard...');
      const response = await fetch('/api/logos/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      console.log('Page: Leaderboard data received:', data);
      console.log('Page: Leaderboard data type:', typeof data);
      console.log('Page: Leaderboard data is array:', Array.isArray(data));
      console.log('Page: Leaderboard data length:', Array.isArray(data) ? data.length : 'not an array');
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
      console.log('Page: Sending vote:', { winnerId, loserId });
      const response = await fetch('/api/logos/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winnerId, loserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Page: Vote request failed:', errorData);
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      const result = await response.json();
      console.log('Page: Vote result:', result);

      await Promise.all([fetchRandomPair(), fetchLeaderboard()]);
    } catch (err) {
      console.error('Page: Error in handleVote:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      console.log('Page: Starting initialization');
      console.log('REDIS_URL:', process.env.REDIS_URL);
      setIsLoading(true);
      setError(null);
      try {
        // Fetch design brief
        console.log('Page: Fetching design brief...');
        const briefResponse = await fetch('/api/design-brief');
        console.log('Page: Design brief response status:', briefResponse.status);
        if (briefResponse.ok) {
          const briefData = await briefResponse.json();
          console.log('Page: Setting design brief');
          setDesignBrief(briefData.designBrief);
        } else {
          console.error('Page: Failed to fetch design brief:', briefResponse.status);
        }

        // Fetch initial pair
        console.log('Page: Fetching initial logo pair...');
        const pairResponse = await fetch('/api/logos/random-pair');
        console.log('Page: Random pair response status:', pairResponse.status);
        
        if (!pairResponse.ok) {
          if (pairResponse.status === 400) {
            console.log('Page: Initial fetch - all comparisons complete');
            setAllVoted(true);
            setLogoPair(null);
          } else {
            const errorData = await pairResponse.json();
            console.error('Page: Failed to fetch logo pair:', errorData);
            throw new Error(errorData.error || 'Failed to fetch logo pair');
          }
        } else {
          const data = await pairResponse.json();
          console.log('Page: Initial logo pair:', data);
          setLogoPair(data);
          setAllVoted(false);
        }

        // Fetch leaderboard
        console.log('Page: Fetching leaderboard...');
        const leaderboardResponse = await fetch('/api/logos/leaderboard');
        console.log('Page: Leaderboard response status:', leaderboardResponse.status);
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          console.log('Page: Setting leaderboard data');
          setLeaderboard(leaderboardData);
        } else {
          console.error('Page: Failed to fetch leaderboard:', leaderboardResponse.status);
        }
      } catch (err) {
        console.error('Page: Error in initialize:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        console.log('Page: Initialization complete, setting isLoading to false');
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  if (isLoading) {
    console.log('Page: Rendering loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Logo ELO Ranking System
        </h1>
        
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
