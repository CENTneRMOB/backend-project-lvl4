// @ts-check

import fastify from 'fastify';
import {
  describe, beforeAll, it, expect,
} from '@jest/globals';
import init from '../server/index.js';

describe('requests', () => {
  let app;

  beforeAll(async () => {
    app = fastify({ logger: { prettyPrint: false } });
    await init(app);
  });

  it('GET 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: app.reverse('root'),
    });
    expect(res.statusCode).toBe(200);
  });

  it('GET 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/wrong-path',
    });
    expect(res.statusCode).toBe(404);
  });

  afterAll(() => {
    app.close();
  });
});
