import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, jsonHeaders } from './helpers.js';

export const options = {
  vus: 1,
  iterations: 5,
};

export default function () {
  const listRes = http.get(`${BASE_URL}/categories?limit=10`);

  check(listRes, {
    'list status 200': (r) => r.status === 200,
    'list has data array': (r) => Array.isArray(r.json('data')),
  });

  const uniqueSlug = `smoke-test-${Date.now()}-${__VU}-${__ITER}`;

  const createRes = http.post(
    `${BASE_URL}/categories`,
    JSON.stringify({ name: 'Smoke Test Category', slug: uniqueSlug }),
    jsonHeaders(),
  );

  check(createRes, {
    'create status 201': (r) => r.status === 201,
    'create returns id': (r) => !!r.json('id'),
  });

  const createdId = createRes.json('id');

  const getRes = http.get(`${BASE_URL}/categories/${createdId}`);

  check(getRes, {
    'get status 200': (r) => r.status === 200,
    'get returns matching slug': (r) => r.json('slug') === uniqueSlug,
  });

  const patchRes = http.patch(
    `${BASE_URL}/categories/${createdId}`,
    JSON.stringify({ name: 'Smoke Test Category (updated)' }),
    jsonHeaders(),
  );

  check(patchRes, {
    'patch status 200': (r) => r.status === 200,
  });

  const deleteRes = http.del(`${BASE_URL}/categories/${createdId}`);

  check(deleteRes, {
    'delete status 204': (r) => r.status === 204,
  });

  sleep(1);
}
