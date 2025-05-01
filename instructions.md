# Logo ELO Ranking System - Development Instructions

## Project Overview
Build a web application that implements an ELO ranking system for logos. Users will be presented with two logos at a time and vote on their preferred option. The system will track these preferences and maintain a leaderboard of the most preferred logos.

## Technical Stack
- **Frontend Framework**: React + Next.js
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel
- **Database**: Vercel KV (Redis) for storing ELO scores and vote history
- **State Management**: React Context API (due to small app size)

## Core Features

### 1. Logo Comparison Interface
- Display two random logos side by side
- Simple click/tap interaction to select preferred logo
- Smooth transition to next comparison
- Prevent duplicate logo combinations for each user
- Implement cookie-based tracking to prevent duplicate votes

### 2. ELO Rating System
- Implement standard ELO rating algorithm
- Starting rating: 1400 for all logos
- Suggested K-factor: 32 (standard for new rating systems)
- Store ratings in Vercel KV

### 3. Leaderboard
- Display all logos sorted by current ELO rating
- Show rating number and total matches for each logo
- Implement infinite scroll or pagination

## Technical Requirements

### Frontend Structure
```text
src/
  components/
    LogoComparison.tsx    # Main comparison component
    Leaderboard.tsx       # Leaderboard display
    ui/                   # shadcn/ui components
  lib/
    elo.ts               # ELO calculation utilities
    cookies.ts           # Cookie management
  pages/
    index.tsx            # Main voting page
    leaderboard.tsx      # Leaderboard page
  types/
    index.ts            # Type definitions
```

### Data Models

```typescript
interface Logo {
  id: string
  url: string
  eloRating: number
  totalMatches: number
}

interface VoteHistory {
  userId: string        // Cookie-based ID
  logoComparisons: Set<string>  // Set of "logo1Id-logo2Id" strings
}
```

### API Routes

```text
/api/
  logos/
    random-pair    # GET: Fetch two random logos
    vote          # POST: Submit vote and update ELO
    leaderboard   # GET: Fetch current rankings
```

## Implementation Guidelines

### 1. Setup and Configuration
- Initialize Next.js project with TypeScript
- Install and configure Tailwind CSS
- Set up shadcn/ui
- Configure Vercel KV for data storage

### 2. Cookie Management
- Generate unique user ID on first visit
- Store in cookie with reasonable expiration (e.g., 30 days)
- Track viewed logo combinations per user

### 3. ELO Implementation
```typescript
function calculateNewRatings(
  winner: number,
  loser: number,
  kFactor: number = 32
): [number, number] {
  const expectedWinner = 1 / (1 + Math.pow(10, (loser - winner) / 400))
  const expectedLoser = 1 / (1 + Math.pow(10, (winner - loser) / 400))
  
  const newWinnerRating = winner + kFactor * (1 - expectedWinner)
  const newLoserRating = loser + kFactor * (0 - expectedLoser)
  
  return [newWinnerRating, newLoserRating]
}
```

### 4. Performance Considerations
- Implement image optimization for logos
- Cache leaderboard data with reasonable TTL
- Use optimistic updates for voting

## Deployment Instructions
1. Create a Vercel account if needed
2. Set up Vercel KV database
3. Configure environment variables
4. Deploy through Vercel CLI or GitHub integration

## Testing Guidelines
- Test ELO calculation logic
- Verify cookie-based duplicate prevention
- Ensure random logo selection is working correctly
- Test mobile responsiveness

## Additional Notes
- Keep the UI simple and focused
- Implement proper error handling for failed votes
- Consider adding basic analytics for voting patterns
- Ensure proper image loading states
- Add simple animations for voting interactions

## Future Enhancements (Optional)
- Add vote history visualization
- Implement logo upload functionality
- Add social sharing features
- Create time-based leaderboards
