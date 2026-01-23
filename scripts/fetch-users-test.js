import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

/* =====================
   ENV CONFIG
===================== */
const BEARER_TOKEN = __ENV.BEARER_TOKEN;
const BASE_URL = 'https://uep-staging-ccayedafayadgzc9.canadacentral-01.azurewebsites.net';

/* =====================
   CUSTOM METRICS
===================== */
export const successRate = new Rate('http_success_rate');
export const serverErrorRate = new Rate('http_5xx_rate');
export const responseTimeTrend = new Trend('response_time_ms');
export const emptyBodyCounter = new Counter('empty_response_body');
export const jsonParseErrorCounter = new Counter('json_parse_errors');

/* =====================
   TEST OPTIONS
   Incremental Load (Capacity Testing)
===================== */
export const options = {
  stages: [
    { duration: '2m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 2000 },
    { duration: '2m', target: 5000 },
    // Uncomment only if system is stable
    // { duration: '2m', target: 10000 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],        // <5% failures acceptable
    http_success_rate: ['rate>0.95'],      // >95% success
    response_time_ms: ['p(95)<800'],       // 95% under 800ms
  },
};

/* =====================
   TEST LOGIC
===================== */
export default function () {
  group('GET /api/users/active', () => {
    const page = Math.floor(Math.random() * 100) + 1;
    const limit = Math.floor(Math.random() * 50) + 1;

    const url = `${BASE_URL}/api/users/active?page=${page}&limit=${limit}`;

    const params = {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: '30s',
    };

    const res = http.get(url, params);

    /* =====================
       METRIC COLLECTION
    ===================== */
    responseTimeTrend.add(res.timings.duration);

    // Status-based tracking
    successRate.add(res.status === 200);
    serverErrorRate.add(res.status >= 500);

    if (!res.body || res.body.length === 0) {
      emptyBodyCounter.add(1);
    }

    /* =====================
       VALIDATIONS
    ===================== */
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 800ms': (r) => r.timings.duration < 800,
      'response time < 2s (acceptable)': (r) => r.timings.duration < 2000,
      'content-type is JSON': (r) =>
        r.headers['Content-Type'] &&
        r.headers['Content-Type'].includes('application/json'),
      'response body is not empty': (r) => r.body && r.body.length > 0,
      'contains expected keys': (r) => {
        try {
          const json = JSON.parse(r.body);
          return json && (json.data || json.results || json.page);
        } catch (e) {
          jsonParseErrorCounter.add(1);
          return false;
        }
      },
    });

    sleep(1);
  });
}
