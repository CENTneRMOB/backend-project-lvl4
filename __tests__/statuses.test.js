// @ts-check

// import _ from 'lodash';
import getApp from '../server/index.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let models;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
  });

  beforeEach(async () => {
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
  });

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.statuses.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('postStatus'),
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);

    const expected = params;
    const status = await models.status.query().findOne({ statusName: params.statusName });

    expect(status).toMatchObject(expected);
  });

  it('edit', async () => {
    const params = testData.statuses.existing;
    const status = await models.status.query().findOne({ statusName: params.statusName });
    const response = await app.inject({
      method: 'GET',
      url: `/statuses/${status.id}/edit`,
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it('update', async () => {
    const newParams = testData.statuses.updating;
    const params = testData.statuses.existing;
    const oldStatus = await models.status.query().findOne({ statusName: params.statusName });
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('patchStatus', { id: oldStatus.id }),
      payload: {
        data: newParams,
      },
    });

    expect(response.statusCode).toBe(302);

    const newStatus = await models.status.query().findById(oldStatus.id);
    const expected = newParams;

    expect(newStatus).toMatchObject(expected);
  });

  it('delete', async () => {
    const params = testData.statuses.deleting;
    const existStatus = await models.status.query().findOne({ statusName: params.statusName });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteStatus', { id: existStatus.id }),
    });

    expect(response.statusCode).toBe(302);

    const expected = await models.status.query().findById(existStatus.id);

    expect(expected).toBeUndefined();
  });

  afterEach(async () => {
    // после каждого теста откатываем миграции
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
