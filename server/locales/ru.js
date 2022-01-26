// @ts-check

module.exports = {
  translation: {
    appName: 'Fastify Шаблон',
    flash: {
      session: {
        create: {
          success: 'Вы залогинены',
          error: 'Неправильный емейл или пароль',
        },
        delete: {
          success: 'Вы разлогинены',
        },
      },
      users: {
        create: {
          error: 'Не удалось зарегистрировать',
          success: 'Пользователь успешно зарегистрирован',
        },
        edit: {
          error: 'Не удалось изменить пользователя',
          success: 'Пользователь успешно изменён',
        },
        delete: {
          error: 'Не удалось удалить пользователя',
          success: 'Пользователь удалён',
        },
      },
      statuses: {
        create: {
          error: 'Не удалось создать статус',
          success: 'Статус успешно создан',
        },
        edit: {
          error: 'Не удалось изменить статус',
          success: 'Статус успешно изменён',
        },
        delete: {
          error: 'Не удалось удалить статус',
          success: 'Статус успешно удалён',
        },
      },
      tasks: {
        create: {
          error: 'Не удалось создать задачу',
          success: 'Задача успешно создана',
        },
        edit: {
          error: 'Не удалось изменить задачу',
          success: 'Задача успешно изменена',
        },
        delete: {
          error: 'Не удалось удалить задачу',
          success: 'Задача успешно удалена',
        },
      },
      labels: {
        create: {
          error: 'Не удалось создать метку',
          success: 'Метка успешно создана',
        },
        edit: {
          error: 'Не удалось изменить метку',
          success: 'Метка успешно изменена',
        },
        delete: {
          error: 'Не удалось удалить метку',
          success: 'Метка успешно удалена',
        },
      },
      authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
      wrongAuth: 'Вы не можете редактировать или удалять другого пользователя.',
    },
    layouts: {
      application: {
        users: 'Пользователи',
        signIn: 'Вход',
        signUp: 'Регистрация',
        signOut: 'Выход',
        statuses: 'Статусы',
        tasks: 'Задачи',
        labels: 'Метки',
      },
    },
    views: {
      sessions: {
        email: 'Email',
        password: 'Пароль',
        new: {
          signIn: 'Вход',
          submit: 'Войти',
        },
      },
      users: {
        id: 'ID',
        firstName: 'Имя',
        lastName: 'Фамилия',
        password: 'Пароль',
        email: 'Email',
        fullName: 'Полное имя',
        createdAt: 'Дата создания',
        new: {
          submit: 'Сохранить',
          signUp: 'Регистрация',
        },
        exist: {
          editing: 'Изменение пользователя',
          edit: 'Изменить',
          delete: 'Удалить',
        },
      },
      welcome: {
        index: {
          hello: 'Привет от Хекслета!',
          description: 'Практические курсы по программированию',
          more: 'Узнать Больше',
        },
      },
      statuses: {
        id: 'ID',
        name: 'Наименование',
        createdAt: 'Дата создания',
        exist: {
          editing: 'Изменение статуса',
          edit: 'Изменить',
          delete: 'Удалить',
        },
        new: {
          create: 'Создать статус',
          creating: 'Создание статуса',
          createConfirm: 'Создать',
        },
      },
      tasks: {
        id: 'ID',
        name: 'Наименование',
        description: 'Описание',
        statusId: 'Статус',
        author: 'Автор',
        executorId: 'Исполнитель',
        createdAt: 'Дата создания',
        labels: 'Метки',
        label: 'Метка',
        isCreatorUser: 'Только мои задачи',
        show: 'Показать',
        new: {
          create: 'Создать задачу',
          creating: 'Создание задачи',
          createConfirm: 'Создать',
        },
        exist: {
          edit: 'Изменить',
          delete: 'Удалить',
          editing: 'Изменение задачи',
        },
      },
      labels: {
        id: 'ID',
        name: 'Наименование',
        createdAt: 'Дата создания',
        exist: {
          editing: 'Изменение метки',
          edit: 'Изменить',
          delete: 'Удалить',
        },
        new: {
          create: 'Создать метку',
          creating: 'Создание метки',
          createConfirm: 'Создать',
        },
      },
    },
  },
};
