// @ts-check

module.exports = {
  translation: {
    appName: 'Task manager',
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
          wrongAuth: 'Вы не можете редактировать или удалять другого пользователя.',
        },
        delete: {
          error: 'Не удалось удалить пользователя',
          success: 'Пользователь успешно удалён',
          wrongAuth: 'Вы не можете редактировать или удалять другого пользователя.',
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
        edit: {
          title: 'Изменение пользователя',
          confirm: 'Изменить',
        },
        delete: {
          confirm: 'Удалить',
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
        create: 'Создать статус',
        edit: {
          title: 'Изменение статуса',
          confirm: 'Изменить',
        },
        delete: {
          confirm: 'Удалить',
        },
        new: {
          title: 'Создание статуса',
          submit: 'Создать',
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
        create: 'Создать задачу',
        new: {
          title: 'Создание задачи',
          submit: 'Создать',
        },
        edit: {
          confirm: 'Изменить',
          title: 'Изменение задачи',
        },
        delete: {
          confirm: 'Удалить',
        },
        filter: {
          label: 'Метка',
          isCreatorUser: 'Только мои задачи',
          show: 'Показать',
        },
      },
      labels: {
        id: 'ID',
        name: 'Наименование',
        createdAt: 'Дата создания',
        create: 'Создать метку',
        edit: {
          title: 'Изменение метки',
          confirm: 'Изменить',
        },
        delete: {
          confirm: 'Удалить',
        },
        new: {
          title: 'Создание метки',
          submit: 'Создать',
        },
      },
    },
  },
};
