// @ts-check

import getApp from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test tasks CRUD', () => {
  let app;
  let knex;
  let models;
  let user;
  let cookies;
  let taskParams;
  let taskId;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
    user = testData.users.existing;
    taskParams = testData.tasks.existing;
  });

  beforeEach(async () => {
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
    cookies = await signIn(app, user);
    const existingTask = await models.task.query().findOne({ name: taskParams.name });
    taskId = existingTask.id;
  });

  describe('positive cases', () => {
    it('index', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('tasks'),
        cookies,
      });
      expect(response.statusCode).toBe(200);
    });

    const query = {
      status: '',
      executor: '',
      label: '',
      isCreatorUser: '',
    };

    const queryParams = [
      ['status', 1, 3],
      ['executor', 1, 1],
      ['label', 4, 1],
      ['isCreatorUser', 'on', 2],
    ];

    it.each(queryParams)('filtered by %s case', async (key, value, tasksLength) => {
      const caseQueryParams = { ...query, [key]: value };

      const response = await app.inject({
        method: 'GET',
        url: app.reverse('tasks'),
        cookies,
        query: caseQueryParams,
      });

      expect(response.statusCode).toBe(200);

      const startOfTable = response.body.indexOf('tbody');
      const endOfTable = response.body.lastIndexOf('tbody');
      const slicedBody = response.body.slice(startOfTable, endOfTable);
      const counts = slicedBody.match(/Изменить/gm);

      expect(counts.length).toBe(tasksLength);
    });

    it('index full filtered case', async () => {
      const fullQuery = {
        status: 1,
        executor: 1,
        label: 4,
        isCreatorUser: 'on',
      };

      const response = await app.inject({
        method: 'GET',
        url: app.reverse('tasks'),
        cookies,
        query: fullQuery,
      });

      expect(response.statusCode).toBe(200);

      const startOfTable = response.body.indexOf('tbody');
      const endOfTable = response.body.lastIndexOf('tbody');
      const slicedBody = response.body.slice(startOfTable, endOfTable);
      const counts = slicedBody.match(/Изменить/gm);

      expect(counts.length).toBe(1);
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

      const task = await models.task.query().findOne({ name: newTask.name });

      expect(task).toMatchObject(newTask);
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

      expect(newTask).toMatchObject(newParams);
    });

    it('delete', async () => {
      const params = testData.tasks.deleting;
      const existingTask = await models.task.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteTask', { id: existingTask.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const expected = await models.task.query().findById(existingTask.id);

      expect(expected).toBeUndefined();
    });
  });

  describe('error cases', () => {
    const routesWithData = [
      ['tasks', 'GET', '', 302],
      ['newTask', 'GET', '', 302],
      ['postTask', 'POST', '', 302],
      ['editTask', 'GET', taskId, 302],
      ['patchTask', 'PATCH', taskId, 302],
      ['deleteTask', 'DELETE', taskId, 302],
    ];

    it.each(routesWithData)('%s auth error case', async (route, method, data, expected) => {
      const response = await app.inject({
        method,
        url: app.reverse(route, { id: `${data}` }),
      });

      expect(response.statusCode).toBe(expected);

      const taskFromDB = await models.task.query().findById(taskId);

      expect(taskFromDB).toMatchObject(taskParams);
    });

    it('create', async () => {
      const newTask = testData.tasks.newWithError;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('postTask'),
        payload: {
          data: newTask,
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);

      const task = await models.task.query().findOne({ name: newTask.name });

      expect(task).toBeUndefined();
    });

    it('update', async () => {
      const newParams = testData.tasks.updatingWithError;
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

      expect(response.statusCode).toBe(422);

      const newTask = await models.task.query().findById(oldTask.id);

      expect(newTask).toMatchObject(params);
    });

    it('delete task by another user instead of creator', async () => {
      const task = testData.tasks.existing;
      const remover = testData.users.existing;
      const newCookies = await signIn(app, remover);
      const existingTask = await models.task.query().findOne({ name: task.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: existingTask.id }),
        cookies: newCookies,
      });

      expect(response.statusCode).toBe(302);

      const expected = await models.task.query().findById(existingTask.id);

      expect(expected).toMatchObject(existingTask);
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
