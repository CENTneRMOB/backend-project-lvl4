// @ts-check

import fastify from 'fastify';
import init from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test labels CRUD', () => {
  let app;
  let knex;
  let models;
  let cookies;
  const testData = getTestData();

  beforeAll(async () => {
    app = fastify({ logger: { prettyPrint: true } });
    await init(app);

    knex = app.objection.knex;
    models = app.objection.models;
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    // @ts-ignore
    await knex.migrate.latest();
    await prepareData(app);
  });

  beforeEach(async () => {
    cookies = await signIn(app, testData.users.existing);
  });

  describe('error cases', () => {
    it.each([
      ['labels', 'GET'],
      ['newLabel', 'GET'],
      ['createLabel', 'POST'],
    ])('%s auth error case without params', async (route, method) => {
      const response = await app.inject({
        method,
        url: app.reverse(route),
      });

      expect(response.statusCode).toBe(302);
    });

    it.each([
      ['editLabel', 'GET'],
      ['updateLabel', 'PATCH'],
      ['deleteLabel', 'DELETE'],
    ])('%s auth error case with param', async (route, method) => {
      const { name } = testData.labels.existing;
      const label = await models.label.query().findOne({ name });

      const response = await app.inject({
        method,
        url: app.reverse(route, { id: label.id }),
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.label.query().findById(label.id);

      expect(actual).toMatchObject(label);
    });

    it('create', async () => {
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('createLabel'),
        payload: {
          data: {},
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);
    });

    it('update', async () => {
      const { name } = testData.labels.existing;
      const { id } = await models.label.query().findOne({ name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateLabel', { id }),
        payload: {
          data: { name: '' },
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);
    });

    it('delete label on task', async () => {
      const { name } = testData.labels.labelFromTask;
      const { id: labelId } = await models.label.query().findOne({ name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteLabel', { id: labelId }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.label.query().findById(labelId);

      expect(actual).not.toBeUndefined();
    });
  });

  describe('positive cases', () => {
    it('index', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('labels'),
        cookies,
      });
      expect(response.statusCode).toBe(200);
    });

    it('new', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newLabel'),
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('create', async () => {
      const data = testData.labels.new;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('createLabel'),
        payload: {
          data,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const label = await models.label.query().findOne({ name: data.name });

      expect(label).toMatchObject(data);
    });

    it('edit', async () => {
      const { name } = testData.labels.existing;
      const { id } = await models.label.query().findOne({ name });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editLabel', { id }),
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('update', async () => {
      const data = testData.labels.updating;
      const { name } = testData.labels.existing;
      const { id } = await models.label.query().findOne({ name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateLabel', { id }),
        payload: {
          data,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.label.query().findById(id);

      expect(actual).toMatchObject(data);
    });

    it('delete', async () => {
      const { name } = testData.labels.deleting;
      const { id: labelId } = await models.label.query().findOne({ name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteLabel', { id: labelId }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.label.query().findById(labelId);

      expect(actual).toBeUndefined();
    });
  });

  afterAll(() => app.close());
});
