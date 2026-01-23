import http from 'k6/http';
import { check, sleep } from 'k6';

const BEARER_TOKEN = __ENV.BEARER_TOKEN;
const VUS = __ENV.VUS ? parseInt(__ENV.VUS) : 10;
const DURATION = __ENV.DURATION || '30s';

export const options = {
    vus: VUS,          // number of virtual users
    duration: DURATION,  // test duration
};

export default function () {
    const url = 'https://uep-staging-ccayedafayadgzc9.canadacentral-01.azurewebsites.net/api/soc?page=1&limit=10';

    const params = {
        headers: {
            Authorization: `Bearer ${BEARER_TOKEN}`,
            'Content-Type': 'application/json',
        },
    };

    const res = http.get(url, params);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
}
