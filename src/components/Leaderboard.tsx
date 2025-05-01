'use client';

import { LeaderboardEntry } from '@/types';
import Image from 'next/image';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  console.log('Leaderboard: Received entries:', entries);
  console.log('Leaderboard: Entries type:', typeof entries);
  console.log('Leaderboard: Entries is array:', Array.isArray(entries));
  console.log('Leaderboard: Entries length:', Array.isArray(entries) ? entries.length : 'not an array');

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Logo Rankings</h2>
      
      {entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No rankings available yet. Start voting to see the leaderboard!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-16 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Logo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matches
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(Array.isArray(entries) ? entries : []).map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="w-16 px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded mx-auto">
                      <img
                        src={entry.url}
                        alt={entry.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                    {entry.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {Math.round(entry.eloRating)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {entry.totalMatches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {entry.winRate ? `${Math.round(entry.winRate * 100)}%` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 