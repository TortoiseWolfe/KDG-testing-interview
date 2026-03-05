import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const listDuration = new Trend('list_customers_duration');
const getDuration = new Trend('get_customer_duration');
const createDuration = new Trend('create_customer_duration');

const BASE_URL = 'http://localhost:5000/api/customers';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    errors: ['rate<0.01'],
    list_customers_duration: ['p(95)<500'],
    get_customer_duration: ['p(95)<500'],
    create_customer_duration: ['p(95)<500'],
  },
};

export default function () {
  // GET /api/customers — list all
  const listRes = http.get(BASE_URL);
  listDuration.add(listRes.timings.duration);
  const listOk = check(listRes, {
    'list: status 200': (r) => r.status === 200,
    'list: is array': (r) => Array.isArray(JSON.parse(r.body)),
  });
  errorRate.add(!listOk);

  // GET /api/customers/{id} — get single (random id 1-100)
  const id = Math.floor(Math.random() * 100) + 1;
  const getRes = http.get(`${BASE_URL}/${id}`);
  getDuration.add(getRes.timings.duration);
  const getOk = check(getRes, {
    'get: status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  errorRate.add(!getOk);

  // POST /api/customers — create
  const payload = JSON.stringify({
    name: `LoadTest User ${Date.now()}`,
    email: `load${Date.now()}@test.com`,
  });
  const createRes = http.post(BASE_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  createDuration.add(createRes.timings.duration);
  const createOk = check(createRes, {
    'create: status 201': (r) => r.status === 201,
  });
  errorRate.add(!createOk);

  sleep(0.1);
}
