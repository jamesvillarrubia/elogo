import fetch from 'node-fetch';

const BASE_URL = 'https://elo-voter-2j0tczkj3-james-villarrubias-projects.vercel.app';

async function testApi() {
  try {
    // Test design brief endpoint
    console.log('Testing design brief endpoint...');
    const briefResponse = await fetch(`${BASE_URL}/api/design-brief`);
    console.log('Design brief response status:', briefResponse.status);
    const briefData = await briefResponse.json();
    console.log('Design brief response:', briefData);

    // Test random pair endpoint
    console.log('\nTesting random pair endpoint...');
    const pairResponse = await fetch(`${BASE_URL}/api/logos/random-pair`);
    console.log('Random pair response status:', pairResponse.status);
    const pairData = await pairResponse.json();
    console.log('Random pair response:', pairData);

    // Test leaderboard endpoint
    console.log('\nTesting leaderboard endpoint...');
    const leaderboardResponse = await fetch(`${BASE_URL}/api/logos/leaderboard`);
    console.log('Leaderboard response status:', leaderboardResponse.status);
    const leaderboardData = await leaderboardResponse.json();
    console.log('Leaderboard response:', leaderboardData);

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApi(); 