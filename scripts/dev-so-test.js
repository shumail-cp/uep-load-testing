// soc-load-test.js
// k6 load test for /api/proxy/api/soc endpoint (random page/limit only—no search).
// Update COOKIE env var with fresh session/access_token.
// Run: k6 run --vus=10 --duration=30s soc-load-test.js
// Or: k6 run --env VUS=50 --env DURATION=1m soc-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: __ENV.VUS ? parseInt(__ENV.VUS) : 10000,
  duration: __ENV.DURATION || '30s',
};

const baseUrl = 'https://dev.overwatch.cloudprimerolabs.com/en/non-technical-risk?page=1&limit=10';
const cookie = __ENV.COOKIE || 'session=%7B%22id%22%3A%22a07fe805-4de1-4077-bd51-01d18027ca60%22%2C%22email%22%3A%22shumail.ansari%40cloudprimero.com%22%2C%22username%22%3A%22shumail.ansari_cloudprimero.com%23EXT%23%40cloudprimeroazuregmail.onmicrosoft.com%22%2C%22first_name%22%3A%22%22%2C%22last_name%22%3A%22%22%2C%22is_internal%22%3Afalse%2C%22can_access_control_panel%22%3Afalse%2C%22tenant%22%3A%7B%22id%22%3A%22012fcef0-85a2-46dc-8ee3-051e2e8a218c%22%2C%22name%22%3A%22UEP%22%2C%22code%22%3A%22uep%22%7D%2C%22roles%22%3A%5B%5D%7D; access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMDdmZTgwNS00ZGUxLTQwNzctYmQ1MS0wMWQxODAyN2NhNjAiLCJlbWFpbCI6InNodW1haWwuYW5zYXJpQGNsb3VkcHJpbWVyby5jb20iLCJpc19pbnRlcm5hbCI6ZmFsc2UsImNhbl9hY2Nlc3NfY29udHJvbF9wYW5lbCI6ZmFsc2UsInRlbmFudF9pZCI6IjAxMmZjZWYwLTg1YTItNDZkYy04ZWUzLTA1MWUyZThhMjE4YyIsInRlbmFudF9jb2RlIjoidWVwIiwiaWF0IjoxNzYwNDg0MzkxLCJleHAiOjE3NjA1NzA3OTF9.nZ3Ku2gZpI26Gwv-7P42xC5IwMcg-LRKibItHn9F7fE; refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMDdmZTgwNS00ZGUxLTQwNzctYmQ1MS0wMWQxODAyN2NhNjAiLCJlbWFpbCI6InNodW1haWwuYW5zYXJpQGNsb3VkcHJpbWVyby5jb20iLCJ0eXBlIjoicmVmcmVzaCIsInRlbmFudF9pZCI6IjAxMmZjZWYwLTg1YTItNDZkYy04ZWUzLTA1MWUyZThhMjE4YyIsInRlbmFudF9jb2RlIjoidWVwIiwiaWF0IjoxNzYwNDg0MzkxLCJleHAiOjE3NjEwODkxOTF9.SatBkIoCWKvpqbZET-oAz2CxBNYPmy0HlJPYf-liAl8; sidebar_state=true';
const headers = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  'pragma': 'no-cache',
  'priority': 'u=1, i',
  'sec-ch-ua': '"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Linux"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'Referer': 'https://dev.overwatch.cloudprimerolabs.com/en/non-technical-risk',
  'Cookie': cookie,
};

export default function () {
  const page = Math.floor(Math.random() * 10) + 1;
  const limits = [10, 20, 50, 100];
  const limit = limits[Math.floor(Math.random() * limits.length)];

  const url = `${baseUrl}?page=${page}&limit=${limit}`;

  const res = http.get(url, { headers });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 800ms': (r) => r.timings.duration < 800,
    'response time < 2s (acceptable)': (r) => r.timings.duration < 2000,
    'response body is not empty': (r) => r.body && r.body.length > 0,
    'response content-type is JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    'contains expected keys': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json && (json.data || json.results || json.page);
      } catch (e) {
        return false;
      }
    },
  });

  if (res.status >= 400) {
    console.error(`❌ Error: ${res.status} on page=${page}, limit=${limit}`);
    console.error(`Response body: ${res.body?.substring(0, 300)}...`);
  } else if (res.timings.duration > 2000) {
    console.warn(`⚠️ Slow: ${res.timings.duration}ms (page=${page}, limit=${limit})`);
  }

  sleep(1);
}

export function handleSummary(data) {
  const avgResp = data.metrics['http_req_duration']?.avg || 0;
  const p95 = data.metrics['http_req_duration']?.p(95) || 0;
  const passedPct = Math.round((1 - (data.metrics['http_req_failed']?.avg || 0) / 100) * 100);
  const errors = data.metrics['http_req_failed']?.failed || 0;

  return {
    stdout: `
┌──────────────────────┐
│   LOAD TEST SUMMARY  │
├──────────────────────┤
│ VUs: ${data.metrics.vus_max?.current} │ Duration: ${options.duration} │
│ Passed: ${Math.round((1 - data.metrics.http_req_failed?.avg / 100) * 100)}% │
│ Avg Resp: ${Math.round(data.metrics.http_req_duration?.avg)}ms │
│ P95: ${Math.round(data.metrics.http_req_duration?.p(95))}ms │
│ Errors: ${data.metrics.http_req_failed?.failed} │
└──────────────────────┘
${Object.entries(data.metrics).filter(([k]) => k.includes('http_req')).map(([k, v]) => `${k}: ${Math.round(v.avg)}ms`).join('\n')}
    `,
    [fileName]: `Full metrics: ${JSON.stringify(data, null, 2)}`,  // Save raw for analysis
  };
}