import http from 'k6/http';
import { check, sleep, fail, group } from 'k6';
import { textSummary } from '../lib/k6-summary.js';
import { htmlReport } from '../lib/k6-reporter.js';
import { Trend, Counter, Rate } from 'k6/metrics';

// Base URL
const BASE_URL = __ENV.BASE_URL || 'https://uep-staging-ccayedafayadgzc9.canadacentral-01.azurewebsites.net';

// Load configuration from environment variables
const BEARER_TOKEN = __ENV.BEARER_TOKEN;
const TEST_NAME = __ENV.TEST_NAME || 'uep-api-performance';
const TEST_ENV = __ENV.TEST_ENV || 'staging';
const LOG_LEVEL = __ENV.LOG_LEVEL || 'info';
const K6_STAGES = __ENV.K6_STAGES;

if (!BEARER_TOKEN) {
  fail('❌ BEARER_TOKEN environment variable must be provided!');
}

// Log environment details
// console.info(`🔍 Test Configuration:`);
// console.info(`🌐 Base URL: ${BASE_URL}`);
// console.info(`🔑 Token: ${BEARER_TOKEN.slice(0, 15)}...`);
// console.info(`📝 Test Name: ${TEST_NAME}`);
// console.info(`🌍 Environment: ${TEST_ENV}`);
// console.info(`📈 Stages: ${K6_STAGES}`);
// console.info(`🛠 Log Level: ${LOG_LEVEL}`);

// Load endpoints from JSON file with error handling
let endpointsData;
try {
  endpointsData = JSON.parse(open('./uep-endpoints.json'));
} catch (err) {
  fail(`❌ Failed to load or parse uep-endpoints.json: ${err.message}`);
}

if (!endpointsData.endpoints || endpointsData.endpoints.length === 0) {
  fail('❌ No endpoints defined in uep-endpoints.json');
}

const endpoints = endpointsData.endpoints.map(endpoint => ({
  ...endpoint,
  url: BASE_URL + endpoint.url,
}));
// console.info(`📋 Loaded ${endpoints.length} endpoints`);

// Custom metrics for detailed reporting
const endpointMetrics = {};
const delayedRequests = new Counter('delayed_requests');
const errorCounts = {
  auth: new Counter('errors_auth'),
  rateLimit: new Counter('errors_rate_limit'),
  server: new Counter('errors_server'),
  client: new Counter('errors_client'),
};
const cleanupTime = new Trend('cleanup_time');

endpoints.forEach(ep => {
  const safeName = ep.name.replace(/[^a-zA-Z0-9_]/g, '_');
  endpointMetrics[safeName] = {
    requestCount: new Counter(`requests_${safeName}`),
    failureRate: new Rate(`failures_${safeName}`),
    responseTime: new Trend(`response_time_${safeName}`),
    errorCounts: {
      auth: new Counter(`errors_auth_${safeName}`),
      rateLimit: new Counter(`errors_rate_limit_${safeName}`),
      server: new Counter(`errors_server_${safeName}`),
      client: new Counter(`errors_client_${safeName}`),
    },
  };
});

let etagCache = {};

// Headers for all requests
const HEADERS = {
  Authorization: `Bearer ${BEARER_TOKEN}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'k6-performance-test/etag-enabled',
  'Cache-Control': 'no-cache',
};

// Parse stages from environment variable
function parseStages(stagesString) {
  try {
    return stagesString.split(',').map(stage => {
      const [duration, target] = stage.split(':');
      if (!duration || isNaN(parseInt(target))) {
        throw new Error(`Invalid stage format: ${stage}`);
      }
      return { duration: duration.trim(), target: parseInt(target.trim()) };
    });
  } catch (err) {
    fail(`❌ Failed to parse stages: ${err.message}`);
  }
}

// Thresholds from environment variables (relaxed for high load)
const thresholdP95 = parseInt(__ENV.K6_THRESHOLDS_P95) || 5000;
const errorRate = parseFloat(__ENV.K6_THRESHOLDS_ERROR_RATE) || 0.10;
const checkRate = parseFloat(__ENV.K6_THRESHOLDS_CHECK_RATE) || 0.90;
const iterationP95 = parseInt(__ENV.K6_ITERATION_DURATION_P95) || 10000;

let thresholds = {
  http_req_duration: [`p(95)<${thresholdP95}`],
  http_req_failed: [`rate<${errorRate}`],
  checks: [`rate>${checkRate}`],
  iteration_duration: [`p(95)<${iterationP95}`],
  delayed_requests: ['count<100'],
};

for (let ep of endpoints) {
  const safeName = ep.name.replace(/[^a-zA-Z0-9_]/g, '_');
  thresholds[`http_req_duration{endpoint:${safeName}}`] = [`p(95)<${thresholdP95}`];
  thresholds[`failures_${safeName}`] = [`rate<${errorRate}`];
}

// Configuration: Use stages if available, otherwise use VUS + duration
let loadConfig = {};
const K6_VUS = __ENV.K6_VUS;
const K6_DURATION = __ENV.K6_DURATION;

if (K6_STAGES && K6_STAGES.trim()) {
  // Use stages configuration (takes priority)
  loadConfig.stages = parseStages(K6_STAGES);
  console.info(`📈 Using stages: ${K6_STAGES}`);
} else if (K6_VUS && K6_DURATION) {
  // Use VUS + duration configuration
  loadConfig.vus = parseInt(K6_VUS);
  loadConfig.duration = K6_DURATION;
  console.info(`📈 Using VUs: ${K6_VUS}, Duration: ${K6_DURATION}`);
} else {
  // Default fallback
  loadConfig.vus = 1;
  loadConfig.duration = '30s';
  console.info(`📈 Using default: VUs: 1, Duration: 30s`);
}

export let options = {
  thresholds,
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'p(95)', 'p(99)'],
  ...loadConfig,
};

// Weighted random endpoint selection
function pickEndpoint() {
  if (!endpoints || endpoints.length === 0) {
    console.error('❌ No endpoints defined in JSON');
    return null;
  }
  const totalWeight = endpoints.reduce((sum, e) => sum + (e.weight || 1), 0);
  let random = Math.random() * totalWeight;
  for (let e of endpoints) {
    random -= e.weight || 1;
    if (random <= 0) return e;
  }
  return endpoints[0];
}

// Main Test Logic
export default function () {
  const startTime = new Date().getTime();
  const endpoint = pickEndpoint();
  if (!endpoint) {
    sleep(0.1);
    return;
  }

  const requestBody = endpoint.body ? JSON.stringify(endpoint.body) : null;
  const safeName = endpoint.name.replace(/[^a-zA-Z0-9_]/g, '_');

  let params = {
    headers: { ...HEADERS },
    tags: { endpoint: safeName, method: endpoint.method || 'GET' },
    timeout: '15s',
  };

  if (etagCache[safeName]) {
    params.headers['If-None-Match'] = etagCache[safeName];
  }

  group(`Endpoint: ${endpoint.name} (${endpoint.url})`, function () {
    let res;
    try {
      switch ((endpoint.method || 'GET').toUpperCase()) {
        case 'POST':
          res = http.post(endpoint.url, requestBody, params);
          break;
        case 'PUT':
          res = http.put(endpoint.url, requestBody, params);
          break;
        case 'PATCH':
          res = http.patch(endpoint.url, requestBody, params);
          break;
        case 'DELETE':
          res = http.del(endpoint.url, null, params);
          break;
        default:
          res = http.get(endpoint.url, params);
          break;
      }

      // Update ETag cache if present
      if (res.headers['ETag']) {
        etagCache[safeName] = res.headers['ETag'];
      }

      // Log request details
      if (LOG_LEVEL === 'debug') {
        console.debug(`📡 Request: ${endpoint.method} ${endpoint.url}`);
        console.debug(`📥 Response: Status=${res.status}, Duration=${res.timings.duration}ms`);
      } else if (LOG_LEVEL === 'info' && res.status >= 400) {
        console.info(`⚠️ Failed request: ${endpoint.method} ${endpoint.url}, Status=${res.status}`);
      }

      // Track delayed requests
      if (res.timings.duration > 3000) {
        delayedRequests.add(1);
        if (LOG_LEVEL === 'debug') {
          console.warn(`⏳ Delayed request on ${endpoint.url}: ${res.timings.duration}ms`);
        }
      }

      // Update custom metrics
      endpointMetrics[safeName].requestCount.add(1);
      endpointMetrics[safeName].responseTime.add(res.timings.duration);
      if (res.status >= 400 || !res) {
        endpointMetrics[safeName].failureRate.add(1);
        if (LOG_LEVEL === 'debug') {
          console.debug(`🔴 Incrementing failure for ${safeName} (Status: ${res.status})`);
        }
        if ([401, 403].includes(res.status)) {
          endpointMetrics[safeName].errorCounts.auth.add(1);
          errorCounts.auth.add(1);
          console.debug(`🔴 Auth error for ${safeName}: ${res.status}`);
        } else if (res.status === 429) {
          endpointMetrics[safeName].errorCounts.rateLimit.add(1);
          errorCounts.rateLimit.add(1);
          console.debug(`🔴 Rate limit error for ${safeName}: ${res.status}`);
        } else if (res.status >= 500) {
          endpointMetrics[safeName].errorCounts.server.add(1);
          errorCounts.server.add(1);
          console.debug(`🔴 Server error for ${safeName}: ${res.status}`);
        } else if (res.status >= 400) {
          endpointMetrics[safeName].errorCounts.client.add(1);
          errorCounts.client.add(1);
          console.debug(`🔴 Client error for ${safeName}: ${res.status}`);
        }
      } else {
        endpointMetrics[safeName].failureRate.add(0);
        if (LOG_LEVEL === 'debug') {
          console.debug(`🟢 Success for ${safeName} (Status: ${res.status})`);
        }
      }

      // Detailed error logging
      if ([401, 403].includes(res.status)) {
        console.warn(`⚠️ Auth issue on ${endpoint.url} → Status: ${res.status}, Body: ${res.body || 'No body'}`);
      } else if (res.status === 429) {
        console.warn(`⚠️ Rate limit hit on ${endpoint.url} → Status: ${res.status}`);
      } else if (res.status >= 500) {
        console.error(`❌ Server error on ${endpoint.url} → Status: ${res.status}, Body: ${res.body || 'No body'}`);
      } else if (res.status >= 400) {
        console.error(`❌ Client error on ${endpoint.url} → Status: ${res.status}, Body: ${res.body || 'No body'}`);
      }

      // Checks inside group
      check(res, {
        [`Status is success (200/304) - ${endpoint.url}`]: (r) => r && [200, 201, 204, 304].includes(r.status),
        [`Response time < 3s - ${endpoint.url}`]: (r) => r && r.timings.duration < 3000,
        [`Body not empty - ${endpoint.url}`]: (r) => r && (r.status === 304 || (r.body && r.body.length > 0)),
        [`Valid JSON - ${endpoint.url}`]: (r) => {
          if (!r || r.status === 304 || !r.body) return true;
          try {
            JSON.parse(r.body);
            return true;
          } catch (e) {
            console.error(`❌ Invalid JSON on ${endpoint.url}: ${e.message}`);
            return false;
          }
        },
      });
    } catch (err) {
      console.error(`❌ Request failed for ${endpoint.url}: ${err.message}`);
      endpointMetrics[safeName].failureRate.add(1);
      endpointMetrics[safeName].requestCount.add(1);
      delayedRequests.add(1);
      if (LOG_LEVEL === 'debug') {
        console.debug(`🔴 Incrementing failure for ${safeName} (Error: ${err.message})`);
      }
    }
  });

  const iterationDuration = new Date().getTime() - startTime;
  if (LOG_LEVEL === 'debug' && iterationDuration > 3000) {
    console.warn(`⏳ Slow iteration for ${endpoint.url}: ${iterationDuration}ms`);
  }

  sleep(0.1 + Math.random() * 0.2);
}

// Teardown to ensure clean shutdown and log cleanup time
export function teardown(data) {
  const startTime = new Date().getTime();
  console.info('🛑 Initiating teardown...');
  
  http.setResponseCallback(http.expectedStatuses(200, 201, 204, 304, 400, 401, 403, 429, { min: 500, max: 599 }));
  
  const cleanupDuration = new Date().getTime() - startTime;
  cleanupTime.add(cleanupDuration);
  console.info(`🧹 Teardown completed in ${cleanupDuration}ms`);
}

// Summary Handler
export function handleSummary(data) {
  console.log('✅ Test execution completed. Generating summary...');

  // Build detailed endpoint metrics for the summary
  const endpointSummary = {};
  Object.keys(endpointMetrics).forEach(safeName => {
    const metrics = data.metrics[`response_time_${safeName}`] || {};
    const failureRate = data.metrics[`failures_${safeName}`]?.values?.rate || 0;
    const requestCount = data.metrics[`requests_${safeName}`]?.values?.count || 0;
    const endpoint = endpoints.find(ep => ep.name.replace(/[^a-zA-Z0-9_]/g, '_') === safeName);

    endpointSummary[safeName] = {
      url: endpoint?.url || 'Unknown',
      requests: requestCount,
      failureRate: (failureRate * 100).toFixed(2),
      passes: data.metrics[`failures_${safeName}`]?.values?.passes || 0,
      fails: data.metrics[`failures_${safeName}`]?.values?.fails || 0,
      avgResponseTime: metrics.values?.avg?.toFixed(2) || 0,
      p95ResponseTime: metrics.values?.['p(95)']?.toFixed(2) || 0,
      errors: {
        auth: data.metrics[`errors_auth_${safeName}`]?.values?.count || 0,
        rateLimit: data.metrics[`errors_rate_limit_${safeName}`]?.values?.count || 0,
        server: data.metrics[`errors_server_${safeName}`]?.values?.count || 0,
        client: data.metrics[`errors_client_${safeName}`]?.values?.count || 0,
      },
    };
  });

  // Sort endpoints by failure rate, then request count
  const sortedEndpointSummary = Object.entries(endpointSummary).sort(
    ([, a], [, b]) => {
      if (parseFloat(b.failureRate) === parseFloat(a.failureRate)) {
        return b.requests - a.requests;
      }
      return parseFloat(b.failureRate) - parseFloat(a.failureRate);
    }
  );

  // Determine test configuration details
  const testConfig = K6_STAGES ? `Stages: ${K6_STAGES}` : 
                    (K6_VUS && K6_DURATION) ? `VUs: ${K6_VUS}, Duration: ${K6_DURATION}` : 
                    'Default: VUs: 1, Duration: 30s';
  
  const testDuration = data.state.testRunDurationMs ? `${(data.state.testRunDurationMs / 1000).toFixed(1)}s` : 'Unknown';
  const totalVUs = data.metrics.vus_max?.values?.max || K6_VUS || 'Unknown';

  // Custom text summary
  const customTextSummary = `
📊 K6 Load Test Summary: ${TEST_NAME}
📅 Date: ${new Date().toISOString()}
🌐 Base URL: ${BASE_URL}
🌍 Environment: ${TEST_ENV}
⚙️ Test Configuration: ${testConfig}
👥 Max VUs: ${totalVUs}
⏱️ Actual Duration: ${testDuration}
🔍 Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
❌ Failed Requests: ${data.metrics.http_req_failed?.values?.count || 0}
⏳ Delayed Requests (>3s): ${data.metrics.delayed_requests?.values?.count || 0}
🧹 Cleanup Time: ${data.metrics.cleanup_time?.values?.avg?.toFixed(2) || 0}ms
🚫 Breached Thresholds: ${Object.keys(data.state.thresholds || {}).filter(t => data.state.thresholds[t].ok === false).length}
✅ Check Pass Rate: ${(data.metrics.checks?.values?.rate * 100 || 0).toFixed(2)}%
🔐 Auth Errors (401/403): ${data.metrics.errors_auth?.values?.count || 0}
🚨 Rate Limit Errors (429): ${data.metrics.errors_rate_limit?.values?.count || 0}
🛑 Server Errors (500+): ${data.metrics.errors_server?.values?.count || 0}
⚠️ Client Errors (400+): ${data.metrics.errors_client?.values?.count || 0}

📋 Endpoint Details (Sorted by Failure Rate, then Request Count):
${sortedEndpointSummary
  .map(
    ([safeName, stats]) => `
🔗 ${safeName} (${stats.url})
  Requests: ${stats.requests}
  Failure Rate: ${stats.failureRate}% (${stats.passes} passes, ${stats.fails} fails)
  Avg Response Time: ${stats.avgResponseTime}ms
  P95 Response Time: ${stats.p95ResponseTime}ms
  Errors:
    Auth (401/403): ${stats.errors.auth}
    Rate Limit (429): ${stats.errors.rateLimit}
    Server (500+): ${stats.errors.server}
    Client (400+): ${stats.errors.client}
`
  )
  .join('\n')}
`;

  return {
    'summary.txt': textSummary(data, { indent: ' ', enableColors: true }) + customTextSummary,
    'summary.html': htmlReport(data, {
      title: `K6 Load Test: ${TEST_NAME}`,
      description: `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="margin: 0 0 10px 0; color: #495057;">📊 Test Configuration</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            <div><strong>🌐 Base URL:</strong> ${BASE_URL}</div>
            <div><strong>🌍 Environment:</strong> ${TEST_ENV}</div>
            <div><strong>⚙️ Configuration:</strong> ${testConfig}</div>
            <div><strong>👥 Max VUs:</strong> ${totalVUs}</div>
            <div><strong>⏱️ Duration:</strong> ${testDuration}</div>
            <div><strong>📅 Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
        </div>
      `,
      groups: data.groups
        ? Object.keys(data.groups).map(group => ({
            name: group,
            collapsible: true,
          }))
        : [],
    }),
    'summary.json': JSON.stringify(
      {
        ...data,
        custom: {
          testName: TEST_NAME,
          baseUrl: BASE_URL,
          environment: TEST_ENV,
          stages: K6_STAGES,
          endpointSummary,
        },
      },
      null,
      2
    ),
  };
}