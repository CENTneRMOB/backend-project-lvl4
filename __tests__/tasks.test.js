// @ts-check

import fastify from 'fastify';
import init from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test tasks CRUD', () => {
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
    await knex.migrate.latest();
    await prepareData(app);
  });

  beforeEach(async () => {
    cookies = await signIn(app, testData.users.existing);
  });

  describe('error cases', () => {
    it.each([
      ['tasks', 'GET'],
      ['newTask', 'GET'],
      ['createTask', 'POST'],
    ])('%s auth error case without params', async (route, method) => {
      const response = await app.inject({
        method,
        url: app.reverse(route),
      });

      expect(response.statusCode).toBe(302);
    });

    it.each([
      ['editTask', 'GET'],
      ['updateTask', 'PATCH'],
      ['deleteTask', 'DELETE'],
    ])('%s auth error case with param', async (route, method) => {
      const { name } = testData.tasks.existing;
      const { id: taskId } = await models.task.query().findOne({ name });

      const response = await app.inject({
        method,
        url: app.reverse(route, { id: taskId }),
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.task.query().findById(taskId);

      expect(actual).not.toBeUndefined();
    });

    it('create', async () => {
      const newTask = testData.tasks.newWithError;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('createTask'),
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
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateTask', { id: oldTask.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);

      const actual = await models.task.query().findById(oldTask.id);

      expect(actual).toMatchObject(params);
    });

    it('delete task by another user instead of creator', async () => {
      const { name } = testData.tasks.existing;
      const { id: taskId } = await models.task.query().findOne({ name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: taskId }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.task.query().findById(taskId);

      expect(actual).not.toBeUndefined();
    });
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
        url: app.reverse('createTask'),
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
      const oldTask = await models.task.query().findOne({ name: newParams.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateTask', { id: oldTask.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.task.query().findById(oldTask.id);

      expect(actual).toMatchObject(newParams);
    });

    it('delete', async () => {
      const { name } = testData.tasks.existing;
      const { id: taskId } = await models.task.query().findOne({ name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteTask', { id: taskId }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.task.query().findById(taskId);

      expect(actual).toBeUndefined();
    });
  });

  afterAll(() => app.close());
});
