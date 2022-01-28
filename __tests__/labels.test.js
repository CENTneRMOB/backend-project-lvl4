// @ts-check

// import _ from 'lodash';
import getApp from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test labels CRUD', () => {
  let app;
  let knex;
  let models;
  let user;
  let cookies;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
    user = testData.users.existing;
  });

  beforeEach(async () => {
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
    cookies = await signIn(app, user);
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

      const expected = newLabel;
      const label = await models.label.query().findOne({ name: newLabel.name });

      expect(label).toMatchObject(expected);
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
      const expected = newParams;

      expect(newLabel).toMatchObject(expected);
    });

    it('delete', async () => {
      const params = testData.labels.deleting;
      const existLabel = await models.label.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteLabel', { id: existLabel.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const expected = await models.label.query().findById(existLabel.id);

      expect(expected).toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('auth errors', async () => {
      const params = testData.labels.existing;
      const label = await models.label.query().findOne({ name: params.name });

      const indexResponse = await app.inject({
        method: 'GET',
        url: app.reverse('labels'),
      });
      expect(indexResponse.statusCode).toBe(302);

      const newResponse = await app.inject({
        method: 'GET',
        url: app.reverse('newLabel'),
      });
      expect(newResponse.statusCode).toBe(302);

      const createResponse = await app.inject({
        method: 'POST',
        url: app.reverse('postLabel'),
      });
      expect(createResponse.statusCode).toBe(302);

      const editResponse = await app.inject({
        method: 'GET',
        url: app.reverse('editLabel', { id: label.id }),
      });
      expect(editResponse.statusCode).toBe(302);

      const updateResponse = await app.inject({
        method: 'PATCH',
        url: app.reverse('patchLabel', { id: label.id }),
      });
      expect(updateResponse.statusCode).toBe(302);

      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteLabel', { id: label.id }),
      });
      expect(deleteResponse.statusCode).toBe(302);
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

      expect(response.statusCode).toBe(200);

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

      expect(response.statusCode).toBe(200);

      const newLabel = await models.label.query().findById(oldLabel.id);
      const expected = newParams;

      expect(newLabel).not.toMatchObject(expected);
    });

    it('delete label on task', async () => {
      const params = testData.labels.labelFromTask;
      const existLabel = await models.label.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteLabel', { id: existLabel.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const expected = await models.label.query().findById(existLabel.id);

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