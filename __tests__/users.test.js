// @ts-check

import fastify from 'fastify';
import { describe } from '@jest/globals';
import _ from 'lodash';
import init from '../server/index.js';
import encrypt from '../server/lib/secure.cjs';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  let user;
  let cookies;
  let taskParams;
  let taskId;
  let statusParams;
  let statusId;
  let labelParams;
  let labelId;
  const testData = getTestData();

  beforeAll(async () => {
    app = fastify({ logger: { prettyPrint: false } });
    await init(app);

    knex = app.objection.knex;
    models = app.objection.models;
    user = testData.users.userForCookies;
    taskParams = testData.tasks.existing;
    statusParams = testData.statuses.existing;
    labelParams = testData.labels.existing;
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
  });

  beforeEach(async () => {
    cookies = await signIn(app, user);
    const existingTask = await models.task.query().findOne({ name: taskParams.name });
    const existingStatus = await models.status.query().findOne({ name: statusParams.name });
    const existingLabel = await models.label.query().findOne({ name: labelParams.name });
    taskId = existingTask.id;
    statusId = existingStatus.id;
    labelId = existingLabel.id;
  });

  describe('positive cases', () => {
    it('index', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('users'),
      });

      expect(response.statusCode).toBe(200);
    });

    it('new', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newUser'),
      });

      expect(response.statusCode).toBe(200);
    });

    it('create', async () => {
      const params = testData.users.new;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('users'),
        payload: {
          data: params,
        },
      });

      expect(response.statusCode).toBe(302);
      const expected = {
        ..._.omit(params, 'password'),
        passwordDigest: encrypt(params.password),
      };
      const itUser = await models.user.query().findOne({ email: params.email });
      expect(itUser).toMatchObject(expected);
    });

    it('edit', async () => {
      const params = testData.users.updating;
      const itCookies = await signIn(app, params);
      const itUser = await models.user.query().findOne({ email: params.email });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editUser', { id: itUser.id }),
        cookies: itCookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('update', async () => {
      const newParams = testData.users.newForUpdate;
      console.log('NEW PARAMS!!!!:', newParams);
      const params = testData.users.updating;
      const itCookies = await signIn(app, params);
      const oldUser = await models.user.query().findOne({ email: params.email });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateUser', { id: oldUser.id }),
        payload: {
          data: newParams,
        },
        cookies: itCookies,
      });

      expect(response.statusCode).toBe(302);

      const newUser = await models.user.query().findById(oldUser.id);
      const expected = {
        ..._.omit(newParams, 'password'),
        passwordDigest: encrypt(newParams.password),
      };

      expect(newUser).toMatchObject(expected);
    });

    it('delete', async () => {
      const itUser = testData.users.deleting;
      const itCookies = await signIn(app, itUser);
      const existingUser = await models.user.query().findOne({ email: itUser.email });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: existingUser.id }),
        cookies: itCookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.user.query().findById(existingUser.id);

      expect(actual).toBeUndefined();
    });

    it('test sign in / sign out', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newSession'),
      });

      expect(response.statusCode).toBe(200);

      const responseSignIn = await app.inject({
        method: 'POST',
        url: app.reverse('session'),
        payload: {
          data: testData.users.existingForSignIn,
        },
      });

      expect(responseSignIn.statusCode).toBe(302);
      // после успешной аутентификации получаем куки из ответа,
      // они понадобятся для выполнения запросов на маршруты требующие
      // предварительную аутентификацию
      const [sessionCookie] = responseSignIn.cookies;
      const { name, value } = sessionCookie;
      const cookie = { [name]: value };

      const responseSignOut = await app.inject({
        method: 'DELETE',
        url: app.reverse('session'),
        // используем полученные ранее куки
        cookies: cookie,
      });

      expect(responseSignOut.statusCode).toBe(302);
    });

    it('index task', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('tasks'),
        cookies,
      });
      expect(response.statusCode).toBe(200);
    });

    it('new task', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newTask'),
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('create task', async () => {
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

    it('edit task', async () => {
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

    it('update task', async () => {
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

    it('delete task', async () => {
      const params = testData.tasks.deleting;
      const existingTask = await models.task.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteTask', { id: existingTask.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.task.query().findById(existingTask.id);

      expect(actual).toBeUndefined();
    });

    it('index status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('statuses'),
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('new status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newStatus'),
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('create status', async () => {
      const newStatus = testData.statuses.new;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('createStatus'),
        payload: {
          data: newStatus,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const status = await models.status.query().findOne({ name: newStatus.name });

      expect(status).toMatchObject(newStatus);
    });

    it('edit status', async () => {
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

    it('update status', async () => {
      const newParams = testData.statuses.updating;
      const params = testData.statuses.existing;
      const oldStatus = await models.status.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateStatus', { id: oldStatus.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(oldStatus.id);

      expect(actual).toMatchObject(newParams);
    });

    it('delete status', async () => {
      const params = testData.statuses.deleting;
      const existingStatus = await models.status.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteStatus', { id: existingStatus.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(existingStatus.id);

      expect(actual).toBeUndefined();
    });

    it('index label', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('labels'),
        cookies,
      });
      expect(response.statusCode).toBe(200);
    });

    it('new label', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newLabel'),
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('create label', async () => {
      const newLabel = testData.labels.new;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('createLabel'),
        payload: {
          data: newLabel,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const label = await models.label.query().findOne({ name: newLabel.name });

      expect(label).toMatchObject(newLabel);
    });

    it('edit label', async () => {
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

    it('update label', async () => {
      const newParams = testData.labels.updating;
      const params = testData.labels.existing;
      const oldLabel = await models.label.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateLabel', { id: oldLabel.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.label.query().findById(oldLabel.id);

      expect(actual).toMatchObject(newParams);
    });

    it('delete label', async () => {
      const params = testData.labels.deleting;
      const existingLabel = await models.label.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteLabel', { id: existingLabel.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.label.query().findById(existingLabel.id);

      expect(actual).toBeUndefined();
    });
  });

  describe('error casses', () => {
    it('create', async () => {
      const params = testData.users.newWithError;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('users'),
        payload: {
          data: params,
        },
      });

      expect(response.statusCode).toBe(422);

      const expected = await models.user.query().findById({ email: params.email });

      expect(expected).toBeUndefined();
    });

    it('edit by another user', async () => {
      const params = testData.users.deleting;
      const existingUser = testData.users.existing;

      const itCookies = await signIn(app, params);
      const itUser = await models.user.query().findOne({ email: existingUser.email });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editUser', { id: itUser.id }),
        cookies: itCookies,
      });

      expect(response.statusCode).toBe(302);
    });

    it('update with user error', async () => {
      const newParams = testData.users.newWithError;
      const params = testData.users.updating;
      const itCookies = await signIn(app, params);
      const oldUser = await models.user.query().findOne({ email: params.email });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateUser', { id: oldUser.id }),
        payload: {
          data: newParams,
        },
        cookies: itCookies,
      });

      expect(response.statusCode).toBe(422);
    });

    it('delete user by another user', async () => {
      const itUser = testData.users.deleting;
      const itCookies = await signIn(app, testData.users.existing);
      const existingUser = await models.user.query().findOne({ email: itUser.email });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: existingUser.id }),
        cookies: itCookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.user.query().findById(existingUser.id);

      expect(actual).toMatchObject(existingUser);
    });

    it('delete task creator', async () => {
      const itUser = testData.users.existing;
      const itCookies = await signIn(app, itUser);
      const existingUser = await models.user.query().findOne({ email: itUser.email });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: existingUser.id }),
        cookies: itCookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.user.query().findById(existingUser.id);

      expect(actual).toMatchObject(existingUser);
    });

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
      const response = await app.inject({
        method,
        url: app.reverse(route, { id: taskId }),
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.task.query().findById(taskId);

      expect(actual).toMatchObject(taskParams);
    });

    it('create task', async () => {
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

    it('update task', async () => {
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
      const task = testData.tasks.existing;
      const newCookies = await signIn(app, testData.users.existing);
      const existingTask = await models.task.query().findOne({ name: task.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: existingTask.id }),
        cookies: newCookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.task.query().findById(existingTask.id);

      expect(actual).toMatchObject(existingTask);
    });

    it.each([
      ['statuses', 'GET'],
      ['newStatus', 'GET'],
      ['createStatus', 'POST'],
    ])('%s auth error case without params', async (route, method) => {
      const response = await app.inject({
        method,
        url: app.reverse(route),
      });

      expect(response.statusCode).toBe(302);
    });

    it.each([
      ['editStatus', 'GET'],
      ['updateStatus', 'PATCH'],
      ['deleteStatus', 'DELETE'],
    ])('%s auth error case with param', async (route, method) => {
      const response = await app.inject({
        method,
        url: app.reverse(route, { id: statusId }),
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(statusId);

      expect(actual).toMatchObject(statusParams);
    });

    it('create status', async () => {
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('createStatus'),
        payload: {
          data: {},
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);
    });

    it('update status', async () => {
      const params = testData.statuses.existing;
      const oldStatus = await models.status.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateStatus', { id: oldStatus.id }),
        payload: {
          data: { name: '' },
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);
    });

    it('delete status on task', async () => {
      const params = testData.statuses.existing;
      const existingStatus = await models.status.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteStatus', { id: existingStatus.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(existingStatus.id);

      expect(actual).toMatchObject(params);
    });

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
      const response = await app.inject({
        method,
        url: app.reverse(route, { id: labelId }),
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.label.query().findById(labelId);

      expect(actual).toMatchObject(labelParams);
    });

    it('create label', async () => {
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

    it('update label', async () => {
      const params = testData.labels.existing;
      const oldLabel = await models.label.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateLabel', { id: oldLabel.id }),
        payload: {
          data: { name: '' },
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);
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

      const actual = await models.label.query().findById(existingLabel.id);

      expect(actual).toMatchObject(params);
    });
  });

  afterAll(async () => {
    app.close();
  });
});
