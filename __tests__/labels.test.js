// @ts-check

import getApp from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test labels CRUD', () => {
  let app;
  let knex;
  let models;
  let user;
  let cookies;
  let labelParams;
  let labelId;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
    user = testData.users.existing;
    labelParams = testData.labels.existing;
  });

  beforeEach(async () => {
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
    cookies = await signIn(app, user);
    const existingLabel = await models.label.query().findOne({ name: labelParams.name });
    labelId = existingLabel.id;
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
      const newLabel = testData.labels.new;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('postLabel'),
        payload: {
          data: newLabel,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const label = await models.label.query().findOne({ name: newLabel.name });

      expect(label).toMatchObject(newLabel);
    });

    it('edit', async () => {
      const params = testData.labels.existing;
      const label = await models.label.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editLabel', { id: label.id }),
        payload: {
          data: params,
        },
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('update', async () => {
      const newParams = testData.labels.updating;
      const params = testData.labels.existing;
      const oldLabel = await models.label.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('patchLabel', { id: oldLabel.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const newLabel = await models.label.query().findById(oldLabel.id);

      expect(newLabel).toMatchObject(newParams);
    });

    it('delete', async () => {
      const params = testData.labels.deleting;
      const existingLabel = await models.label.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteLabel', { id: existingLabel.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const expected = await models.label.query().findById(existingLabel.id);

      expect(expected).toBeUndefined();
    });
  });

  describe('error cases', () => {
    const routesWithData = [
      ['labels', 'GET', '', 302],
      ['newLabel', 'GET', '', 302],
      ['postLabel', 'POST', '', 302],
      ['editLabel', 'GET', labelId, 302],
      ['patchLabel', 'PATCH', labelId, 302],
      ['deleteLabel', 'DELETE', labelId, 302],
    ];

    it.each(routesWithData)('%s auth error case', async (route, method, data, expected) => {
      const response = await app.inject({
        method,
        url: app.reverse(route, { id: `${data}` }),
      });

      expect(response.statusCode).toBe(expected);

      const labelFromDB = await models.label.query().findById(labelId);

      expect(labelFromDB).toMatchObject(labelParams);
    });

    it('create', async () => {
      const newLabel = testData.labels.newWithError;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('postLabel'),
        payload: {
          data: newLabel,
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);

      const label = await models.label.query().findOne({ name: newLabel.name });

      expect(label).toBeUndefined();
    });

    it('update', async () => {
      const newParams = testData.labels.updatingWithError;
      const params = testData.labels.existing;
      const oldLabel = await models.label.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('patchLabel', { id: oldLabel.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);

      const newLabel = await models.label.query().findById(oldLabel.id);

      expect(newLabel).toMatchObject(params);
    });

    it('delete label on task', async () => {
      const params = testData.labels.labelFromTask;
      const existingLabel = await models.label.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteLabel', { id: existingLabel.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const expected = await models.label.query().findById(existingLabel.id);

      expect(expected).toMatchObject(params);
    });
  });

  afterEach(async () => {
    // после каждого теста откатываем миграции
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
