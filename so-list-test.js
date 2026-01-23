// so-list-test.js
// Bun.js script: Tests SO list API with dynamic query params (page, limit, sortBy, search).
// Run with: bun run so-list-test.js

const baseUrl = 'https://uep-staging-ccayedafayadgzc9.canadacentral-01.azurewebsites.net/api/so-cqrs/list';
const headers = {
  'accept': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiN2NlYTRmNy1kMzRiLTRlMTYtYjA3MC01YTVkY2FjMDIwZmEiLCJlbWFpbCI6InNodW1haWwuYW5zYXJpQGNsb3VkcHJpbWVyby5jb20iLCJpc19pbnRlcm5hbCI6ZmFsc2UsImNhbl9hY2Nlc3NfY29udHJvbF9wYW5lbCI6ZmFsc2UsInRlbmFudF9pZCI6Ijk1NGVmOTJkLTYzNDktNDY3Mi05NWYxLWIzMWFkNTJjMDE5OSIsInRlbmFudF9jb2RlIjoidWVwIiwicm9sZSI6IlVzZXIiLCJpYXQiOjE3NjA1MTgzNTQsImV4cCI6MTc2MDYwNDc1NH0.YZRrDkzzmgPhOSDq7KbPYFnuzBWaxNEvzgqv2_TewC0'
};

async function callListApi({ page = 1, limit = 10, sortBy = 'createdAt', search = '' } = {}) {
  const params = new URLSearchParams({ page, limit, sortBy });
  if (search) params.append('search', search);
  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, { method: 'GET', headers });

    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();  // Fallback
    }

    if (!response.ok) {
      console.error(`List API failed: ${response.status} - Body: ${JSON.stringify(data, null, 2)}`);
      return;
    }

    console.log(`List API success (page ${page}, limit ${limit}, sortBy ${sortBy}, search "${search}"):`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Network error: ${error.message}`);
  }
}

async function main() {
  console.log('Testing SO list API with dynamic params...\n');

  // Test 1: Base (matches curl)
  console.log('--- Test 1: Base params ---');
  await callListApi({ page: 1, limit: 10, sortBy: 'createdAt' });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: With search
  console.log('\n--- Test 2: With search ---');
  await callListApi({ page: 1, limit: 5, sortBy: 'updatedAt', search: 'hazard' });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Next page
  console.log('\n--- Test 3: Page 2 ---');
  await callListApi({ page: 2, limit: 10, sortBy: 'createdAt' });

  console.log('\nAll tests completed.');
}

main();