# K6 Performance Testing Suite

A comprehensive performance testing framework using [K6](https://k6.io/) (Grafana's load testing tool) for benchmarking APIs. Generates detailed HTML/JSON reports with custom metrics and performance thresholds.

## Overview

This project enables you to:
- Run **capacity tests** with incremental load stages (500 → 1000 → 2000 → 5000 virtual users)
- Test **multiple API endpoints** with weighted request distribution
- **Monitor custom metrics** like response times, success rates, and error conditions
- Generate **professional HTML reports** with multiple theme options
- Validate **performance thresholds** (e.g., <5% failure rate, <800ms response time at p95)

## Prerequisites

- **K6**: Install from [k6.io/docs/getting-started/installation](https://k6.io/docs/getting-started/installation/)
- **Bun**: Install from [bun.sh](https://bun.sh) (or use Node.js)
- **API Token**: Valid Bearer token for the target API
- **Target Environment**: Staging API URL

Verify installation:
```bash
k6 --version
bun --version
```

## Installation

```bash
# Clone/navigate to project directory
cd perf-test

# Install dependencies
bun install
```

## Configuration

### 1. Create `.env` file

Copy `.env.example` if available, or create `.env` in the project root:

```bash
# Required
BEARER_TOKEN=your_bearer_token_here
BASE_URL=https://your-api-staging.example.com

# Optional (defaults to values in test scripts)
K6_DURATION=5m
K6_VUS=10
```

**Important**: `.env` should NOT be committed to version control.

### 2. Verify Token Access

Test your configuration:
```bash
curl -H "Authorization: Bearer $BEARER_TOKEN" $BASE_URL/api/health
```

## Running Tests

### Option 1: Interactive via run.sh (Recommended)
```bash
./run.sh
# Prompts for test duration, then executes fetch-users-test.js
```

### Option 2: Via npm scripts
```bash
# Run specific test
bun run start:fetch-users-test    # Capacity test (500-5000 VUs over 8 minutes)
bun run start:so-create-test      # SO creation endpoint
bun run start:so-list-test        # SO listing endpoint
bun run start:soc-test            # SOC endpoint test
```

### Option 3: Direct K6 command
```bash
# Custom duration
K6_DURATION=3m k6 run scripts/fetch-users-test.js --env BEARER_TOKEN=$BEARER_TOKEN

# Custom VUs (replaces stages)
K6_VUS=50 K6_DURATION=2m k6 run scripts/soc-test.js --env BEARER_TOKEN=$BEARER_TOKEN
```

### Option 4: VS Code Tasks
Open Command Palette (`Cmd/Ctrl + Shift + P`):
- **"Run K6 Test"** - Interactive duration input → executes test
- **"Open latest report"** - Displays latest HTML report in browser
- **"Stop k6 (graceful)"** - Gracefully stops running K6 process

## Understanding Test Results

### Report Files

After each test run, reports are saved to:
- **`scripts/summary.html`** - Interactive HTML report (latest)
- **`scripts/summary.json`** - Raw metrics data
- **`reports/{timestamp}/`** - Archived reports with metadata

### Report Contents

1. **Key Metrics Dashboard**
   - Total Requests: Number of HTTP requests sent
   - Failed Requests: Requests with status ≠ 200
   - Breached Thresholds: Performance criteria not met
   - Failed Checks: Custom assertions that failed

2. **Detailed Metrics Tab**
   - Trend metrics (response times: avg, p50, p95, p99, max)
   - Rate metrics (success rate, error rates)
   - Counters (empty responses, JSON parse errors)
   - Custom metrics (defined in test script)

3. **Test Run Details Tab**
   - Checks passed/failed
   - Iteration count and rate
   - Virtual users (min/max)
   - Data received/sent

4. **Checks & Groups Tab**
   - Per-endpoint check results
   - Success/failure breakdown by test group

### Performance Thresholds

Default thresholds (see `fetch-users-test.js`):
```javascript
thresholds: {
  http_req_failed: ['rate<0.05'],        // <5% failures acceptable
  http_success_rate: ['rate>0.95'],      // >95% success
  response_time_ms: ['p(95)<800'],       // 95th percentile <800ms
}
```

Test fails if ANY threshold is breached.

## Test Structure

### Capacity Testing (fetch-users-test.js)
- **Duration**: 8 minutes total
- **Stages**:
  1. 2 min → 500 VUs (ramp-up)
  2. 2 min → 1000 VUs
  3. 2 min → 2000 VUs
  4. 2 min → 5000 VUs (peak load)
- **Metrics**: Custom Trend/Rate/Counter for detailed tracking

### Endpoint Selection
Tests use `endpoints.json` with weighted random selection:
- **Weight 1** (standard): health, roles, permissions, designations, etc.
- **Weight 10** (high traffic): departments, incidents, observations, SO, SOC

Weighted selection simulates realistic traffic patterns.

### Custom Metrics Example
```javascript
export const successRate = new Rate('http_success_rate');
export const responseTimeTrend = new Trend('response_time_ms');

// In test function
successRate.add(res.status === 200);
responseTimeTrend.add(res.timings.duration);
```

## Adding New Tests

1. **Create test file** in `scripts/your-test.js`
2. **Define load profile**:
   ```javascript
   export const options = {
     stages: [
       { duration: '2m', target: 100 },
       { duration: '5m', target: 100 },
       { duration: '2m', target: 0 },
     ],
   };
   ```
3. **Add assertions**:
   ```javascript
   check(res, {
     'status is 200': (r) => r.status === 200,
     'response time < 500ms': (r) => r.timings.duration < 500,
   });
   ```
4. **Add npm script** to `package.json`:
   ```json
   "start:your-test": "k6 run scripts/your-test.js --env BEARER_TOKEN=$BEARER_TOKEN"
   ```
5. **Run it**:
   ```bash
   bun run start:your-test
   ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **K6 not found** | Run `which k6` and verify K6 installation PATH |
| **`.env` file missing** | Create `.env` with `BEARER_TOKEN` and `BASE_URL` |
| **Authentication failed** | Verify bearer token is valid: `curl -H "Authorization: Bearer $BEARER_TOKEN" $BASE_URL/api/health` |
| **Tests blocked terminal** | Use VS Code task "Stop k6 (graceful)" to send SIGINT |
| **High failure rate** | Check API health, verify token permissions, reduce VU count |
| **Report not generated** | Run test with `--out json=summary.json` flag explicitly |

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BEARER_TOKEN` | ✓ | API authentication token | `Bearer eyJhbGc...` |
| `BASE_URL` | ✓ | Target API base URL | `https://api-staging.example.com` |
| `K6_DURATION` | ✗ | Test duration (overrides stages) | `5m`, `300s` |
| `K6_VUS` | ✗ | Virtual users (overrides stages) | `100` |

## Report Themes

K6 Reporter supports multiple themes (set in code):
- **`default`** - Modern purple gradient (recommended)
- **`classic`** - Pure.css lightweight design
- **`bootstrap`** - Bootstrap 5 grid layout
- **`bootswatch:cerulean`** - Bootswatch themes (80+ options)

## Project Structure

```
perf-test/
├── scripts/                    # K6 test files
│   ├── fetch-users-test.js    # Capacity testing (main)
│   ├── soc-test.js            # SOC endpoint test
│   ├── so-create-test.js      # SO creation test
│   ├── endpoints.json         # API endpoint definitions
│   ├── summary.html           # Latest report (auto-generated)
│   └── summary.json           # Latest metrics (auto-generated)
├── lib/
│   ├── k6-reporter.js         # HTML report generator (EJS templates)
│   └── k6-summary.js          # Terminal output formatter
├── reports/                    # Archived test reports
├── run.sh                      # Test runner wrapper
├── package.json               # Bun/npm scripts
├── .env                       # Configuration (not committed)
└── README.md                  # This file
```

## Advanced Usage

### Running with custom thresholds
Edit test file thresholds before running:
```javascript
thresholds: {
  http_req_failed: ['rate<0.10'],     // Relax to 10% failure tolerance
  response_time_ms: ['p(95)<1000'],   // Increase to 1000ms
}
```

### Debugging a single request
Modify test to use a fixed endpoint:
```javascript
const url = `${BASE_URL}/api/users/active?page=1&limit=10`;
```

### Running multiple test files sequentially
```bash
k6 run scripts/fetch-users-test.js && k6 run scripts/soc-test.js
```

## Resources

- [K6 Documentation](https://k6.io/docs/)
- [K6 HTTP API](https://k6.io/docs/javascript-api/k6-http/)
- [K6 Metrics](https://k6.io/docs/javascript-api/k6-metrics/)
- [K6 Reporter GitHub](https://github.com/benc-uk/k6-reporter)
- [Bun Documentation](https://bun.sh/docs)

## Contributing

When adding new tests:
1. Follow naming convention: `{feature}-test.js`
2. Include descriptive check messages
3. Define reasonable thresholds based on baseline
4. Document special parameters in code comments
5. Add npm script to `package.json`

## License

Internal project - CloudPrimero

---

**Last Updated**: January 2026 | **K6 Version**: 0.50+ | **Bun Version**: 1.0+
