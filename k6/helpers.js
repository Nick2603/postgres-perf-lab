import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

export function jsonHeaders() {
  return { headers: { 'Content-Type': 'application/json' } };
}
