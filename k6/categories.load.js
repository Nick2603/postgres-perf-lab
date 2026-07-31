import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, jsonHeaders } from './helpers.js';

export const options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '30s', target: 10 },
    { duration: '15s', target: 50 },
    { duration: '30s', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

// Runs once, before any VU starts iterating. Whatever this returns is
// passed as `data` into every default() call across every VU.
export function setup() {
  const res = http.get(`${BASE_URL}/categories?limit=50`);

  if (res.status !== 200) {
    throw new Error(`setup() failed to fetch categories: status ${res.status}`);
  }

  const ids = res.json('data').map((category) => category.id);

  if (ids.length === 0) {
    throw new Error('setup() found no categories to test against -- seed the database first');
  }

  return { categoryIds: ids };
}

export default function (data) {
  const roll = Math.random();

  if (roll < 0.6) {
    // 60% list
    const res = http.get(`${BASE_URL}/categories?limit=20`);

    check(res, { 'list ok': (r) => r.status === 200 });
  } else if (roll < 0.9) {
    // 30% get one -- a real, known id from setup(), not a random UUID
    const id = data.categoryIds[Math.floor(Math.random() * data.categoryIds.length)];

    const res = http.get(`${BASE_URL}/categories/${id}`);

    check(res, { 'get one ok': (r) => r.status === 200 });
  } else {
    // 10% write
    const res = http.post(
      `${BASE_URL}/categories`,
      JSON.stringify({ name: 'Load Test', slug: `load-${Date.now()}-${__VU}-${__ITER}` }),
      jsonHeaders(),
    );

    check(res, { 'create ok': (r) => r.status === 201 });
  }

  sleep(0.5);
}
