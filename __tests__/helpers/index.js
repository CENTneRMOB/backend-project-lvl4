// @ts-check

import fs from 'fs';
import path from 'path';

const getFixturePath = (filename) => path.join(__dirname, '..', '..', '__fixtures__', filename);
const readFixture = (filename) => fs.readFileSync(getFixturePath(filename), 'utf-8').trim();
const getFixtureData = (filename) => JSON.parse(readFixture(filename));

export const getTestData = () => getFixtureData('testData.json');

export const prepareData = async (app) => {
  const { knex } = app.objection;

  // получаем данные из фикстур и заполняем БД
  await knex('users').insert(getFixtureData('users.json'));
  await knex('statuses').insert(getFixtureData('statuses.json'));
  await knex('tasks').insert(getFixtureData('tasks.json'));
  await knex('labels').insert(getFixtureData('labels.json'));
};

export const signIn = async (app, user) => {
  const { email, password } = user;
  const responseSignIn = await app.inject({
    method: 'POST',
    url: app.reverse('session'),
    payload: {
      data: { email, password },
    },
  });

  // после успешной аутентификации получаем куки из ответа,
  // они понадобятся для выполнения запросов на маршруты требующие
  // предварительную аутентификацию
  const [sessionCookie] = responseSignIn.cookies;
  const { name, value } = sessionCookie;
  const cookie = { [name]: value };
  // console.log('cookie', cookie);
  return cookie;
};
