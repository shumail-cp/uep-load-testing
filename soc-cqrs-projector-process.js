// api-loop-test-fixed.js
// Bun.js script: Retries 500s, logs error details, 5s delays.
// Run with: bun run api-loop-test-fixed.js

async function callApi(attempt = 1) {
  const url = 'https://uep-dev-argre0aphwb8avah.canadacentral-01.azurewebsites.net/api/soc-cqrs/projector/process';
  const headers = {
    'accept': '*/*',
    'x-api-key': 'c74da59424ff3f50e89380b59a53195a422363c7ceffeb901c096126724303ec',
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({ tenant_code: 'uep' });

  try {
    const response = await fetch(url, { method: 'POST', headers, body });

    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();  // Fallback for non-JSON
    }

    if (!response.ok) {
      if (response.status === 500 && attempt < 3) {
        console.error(`500 on attempt ${attempt}/3: ${data}`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));  // Backoff: 2s, 4s
        return callApi(attempt + 1);  // Retry
      }
      console.error(`API call failed (final): ${response.status} ${response.statusText} - Body: ${JSON.stringify(data, null, 2)}`);
      return;
    }

    console.log(`Response ${Date.now()}:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Network error: ${error.message}`);
  }
}

async function main() {
  console.log('Starting 1000 resilient API calls...');
  for (let i = 1; i <= 1000; i++) {
    console.log(`\n--- Call ${i}/1000 ---`);
    await callApi();
    await new Promise(resolve => setTimeout(resolve, 5000));  // 5s chill
  }
  console.log('\nAll 1000 calls done.');
}

main();