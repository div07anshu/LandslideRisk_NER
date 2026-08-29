import request from 'supertest';
import { createApp } from '../app';

describe('GET /api/health (public)', () => {
  const app = createApp();

  it('returns 200 with status ok and requires no Authorization header', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'landslide-risk-backend',
    });
  });
});
