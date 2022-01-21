// @ts-check

// import _ from 'lodash';
import getApp from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test tasks CRUD', () => {
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
      url: app.reverse('tasks'),
      cookies,
    });
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newTask'),
      cookies,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const newTask = testData.tasks.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('postTask'),
      payload: {
        data: newTask,
      },
      cookies,
    });

    expect(response.statusCode).toBe(302);

    const expected = newTask;
    const task = await models.task.query().findOne({ name: newTask.name });

    expect(task).toMatchObject(expected);
  });

  it('edit', async () => {
    const params = testData.tasks.existing;
    const task = await models.task.query().findOne({ name: params.name });
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editTask', { id: task.id }),
      payload: {
        data: params,
      },
      cookies,
    });

    expect(response.statusCode).toBe(200);
  });

  it('update', async () => {
    const newParams = testData.tasks.updating;
    const params = testData.tasks.existing;
    const oldTask = await models.task.query().findOne({ name: params.name });
    const data = Object.assign(oldTask, newParams);
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('patchTask', { id: oldTask.id }),
      payload: {
        data,
      },
      cookies,
    });

    expect(response.statusCode).toBe(302);

    const newTask = await models.task.query().findById(oldTask.id);
    const expected = newParams;

    expect(newTask).toMatchObject(expected);
  });

  it('delete', async () => {
    const params = testData.tasks.deleting;
    const existTask = await models.task.query().findOne({ name: params.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteTask', { id: existTask.id }),
      cookies,
    });

    expect(response.statusCode).toBe(302);

    const expected = await models.task.query().findById(existTask.id);

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
