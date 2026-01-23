# K6 Performance Testing Suite - AI Agent Instructions

## Project Overview
A performance testing framework using K6 (Grafana's load testing tool) to benchmark APIs. Tests run against staging environments and generate detailed HTML/JSON reports with custom metrics and thresholds.

## Architecture

### Test Types
- **Capacity Testing**: Incremental load stages in `fetch-users-test.js` (500→1000→2000→5000 VUs)
- **Endpoint Coverage**: JSON-based endpoint list (`endpoints.json`) with weighted random selection in tests
- **Custom Metrics**: Track response times, success rates, empty bodies, JSON parse errors via `Trend`, `Counter`, `Rate` metrics

### Key Components
- **Entry Point**: `run.sh` - bash wrapper that loads `.env`, validates config, executes K6 tests from `scripts/` directory
- **Test Scripts**: Located in `scripts/` - JavaScript files using K6 SDK (Bun runtime)
- **Report Generation**: `lib/k6-reporter.js` (HTML templates, multiple themes) + `lib/k6-summary.js` (terminal output)
- **Configuration**: Environment-driven - `BEARER_TOKEN`, `BASE_URL`, `K6_DURATION`, `K6_VUS` from `.env`

## Developer Workflows

### Running Tests
```bash
# Via npm scripts (from package.json)
bun run start:fetch-users-test
bun run start:so-create-test
bun run start:soc-test

# Via run.sh (interactive with duration input)
./run.sh

# K6 directly
K6_DURATION=1m k6 run scripts/fetch-users-test.js --env BEARER_TOKEN=$TOKEN
```

### VS Code Tasks
Use the workspace tasks:
- **"Run K6 Test"** - Interactive duration input, executes `run.sh`
- **"Open latest report"** - Launches `summary.html` in browser
- **"Stop k6 (graceful)"** - Sends SIGINT to running K6 processes

### Adding New Tests
1. Create `scripts/your-test.js` following K6 conventions
2. Define `options.stages` or `options.vus/duration` for load profile
3. Use custom metrics: `new Trend()`, `new Rate()`, `new Counter()`
4. Add checks: `check(res, {'status is 200': (r) => r.status === 200})`
5. Add npm script to `package.json` if needed

## Project Patterns

### Test Structure (see `fetch-users-test.js`)
```javascript
// 1. Environment config at top
const BEARER_TOKEN = __ENV.BEARER_TOKEN;
const BASE_URL = __ENV.BASE_URL;

// 2. Custom metrics
export const successRate = new Rate('http_success_rate');
export const responseTimeTrend = new Trend('response_time_ms');

// 3. Load profile in options
export const options = {
  stages: [
    { duration: '2m', target: 500 },
    { duration: '2m', target: 1000 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],    // <5% failures
    http_success_rate: ['rate>0.95'],  // >95% success
    response_time_ms: ['p(95)<800'],   // 95th percentile <800ms
  },
};

// 4. Test function with groups
export default function () {
  group('GET /api/users/active', () => {
    // randomize parameters
    const params = { headers: { Authorization: `Bearer ${BEARER_TOKEN}` } };
    const res = http.get(url, params);
    check(res, { 'status is 200': (r) => r.status === 200 });
  });
}
```

### Endpoint Strategy
`endpoints.json` weights endpoints by request frequency - departments/incidents (weight 10) appear 10x more than roles (weight 1). Tests should randomly select from this list.

### Report Themes
K6 Reporter supports: `default` (modern purple), `classic` (Pure.css), `bootstrap`/`bootswatch:*` (Bootstrap 5).

## Critical Configuration
- **`.env` required**: Must define `BEARER_TOKEN` and `BASE_URL`, optional `K6_DURATION`
- **Thresholds**: Fail if >5% requests fail, <95% success rate, or 95th percentile >800ms response
- **Report Output**: HTML/JSON saved to `scripts/summary.*` and timestamped in `reports/`

## Common Issues
- Missing `.env` file → script exits with error message
- K6 not in PATH → check installation: `k6 --version`
- Token expired → update `BEARER_TOKEN` in `.env`
- Tests blocking terminal → use VS Code task "Stop k6 (graceful)" to SIGINT process

## When Adding Features
- Test scripts: Keep env-driven, parameterize endpoints, use `check()` liberally
- Reports: Modify EJS templates in `k6-reporter.js`, test with multiple theme options
- CI/CD: Ensure `.env` template exists for secret injection (not committed)
