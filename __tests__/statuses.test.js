// @ts-check

// import _ from 'lodash';
import getApp from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test statuses CRUD', () => {
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

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
      cookies,
    });
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
      cookies,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const newStatus = testData.statuses.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('postStatus'),
      payload: {
        data: newStatus,
      },
      cookies,
    });

    expect(response.statusCode).toBe(302);

    const expected = newStatus;
    const status = await models.status.query().findOne({ name: newStatus.name });

    expect(status).toMatchObject(expected);
  });

  it('edit', async () => {
    const params = testData.statuses.existing;
    const status = await models.status.query().findOne({ name: params.name });
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editStatus', { id: status.id }),
      payload: {
        data: params,
      },
      cookies,
    });

    expect(response.statusCode).toBe(200);
  });

  it('update', async () => {
    const newParams = testData.statuses.updating; // updateStatus
    const params = testData.statuses.existing; // firstStatus
    const oldStatus = await models.status.query().findOne({ name: params.name });
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('patchStatus', { id: oldStatus.id }),
      payload: {
        data: newParams,
      },
      cookies,
    });

    expect(response.statusCode).toBe(302);

    const newStatus = await models.status.query().findById(oldStatus.id);
    const expected = newParams;

    expect(newStatus).toMatchObject(expected);
  });

  it('delete', async () => {
    const params = testData.statuses.deleting; // thirdStatus
    const existStatus = await models.status.query().findOne({ name: params.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteStatus', { id: existStatus.id }),
      cookies,
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
