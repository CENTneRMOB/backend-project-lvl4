// @ts-check

// import _ from 'lodash';
import getApp from '../server/index.js';
// import { getTestData, prepareData } from './helpers/index.js';
import { prepareData } from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  // let models;
  // const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    // models = app.objection.models;
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

  // it.only('create', async () => {
  //   const params = testData.statuses.new;
  //   const response = await app.inject({
  //     method: 'POST',
  //     url: app.reverse('postStatus'),
  //     payload: {
  //       data: params,
  //     },
  //   });

  //   expect(response.statusCode).toBe(200);

  //   const expected = params;
  //   const status = await models.status.query();

  //   console.log('EXPECT: ', expected);
  //   console.log('STATUS: ', status);
  //   expect(status).toMatchObject(expected);
  // });

  // it('edit', async () => {
  //   const params = testData.users.existing;
  //   const user = await models.user.query().findOne({ email: params.email });
  //   const response = await app.inject({
  //     method: 'GET',
  //     url: `/users/${user.id}/edit`,
  //     payload: {
  //       data: params,
  //     },
  //   });

  //   expect(response.statusCode).toBe(302);
  // });

  // it('update', async () => {
  //   const newParams = testData.users.new;
  //   const params = testData.users.updating;
  //   const oldUser = await models.user.query().findOne({ email: params.email });
  //   const response = await app.inject({
  //     method: 'PATCH',
  //     url: app.reverse('editUser', { id: oldUser.id }),
  //     payload: {
  //       data: newParams,
  //     },
  //   });

  //   expect(response.statusCode).toBe(302);

  //   const newUser = await models.user.query().findById(oldUser.id);
  //   const expected = {
  //     ..._.omit(newParams, 'password'),
  //     passwordDigest: encrypt(newParams.password),
  //   };

  //   expect(newUser).toMatchObject(expected);
  // });

  // it('delete', async () => {
  //   const params = testData.users.deleting;
  //   const user = await models.user.query().findOne({ email: params.email });

  //   const response = await app.inject({
  //     method: 'DELETE',
  //     url: app.reverse('deleteUser', { id: user.id }),
  //   });

  //   expect(response.statusCode).toBe(302);

  //   const expected = await models.user.query().findById(user.id);

  //   expect(expected).toBeUndefined();
  // });

  afterEach(async () => {
    // после каждого теста откатываем миграции
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
