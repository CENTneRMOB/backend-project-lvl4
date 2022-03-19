// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const tasks = await app.objection.models.task.query().withGraphJoined('[creator, executor, status, labels]');
      const statuses = await app.objection.models.status.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();

      const queryParams = Object.entries(req.query)
        .filter(([, value]) => value)
        .map(([param, value]) => {
          if (!Number(value)) {
            return ['creator', req.user.id];
          }
          return [param, Number(value)];
        });

      const objectQueryParams = Object.fromEntries(queryParams);
      const {
        status, executor, label, creator,
      } = objectQueryParams;

      let filteredTasks = tasks;
      if (status) {
        filteredTasks = filteredTasks
          .filter((task) => task.status.id === status);
      }
      if (executor) {
        filteredTasks = filteredTasks
          .filter((task) => task.executor && task.executor.id === executor);
      }
      if (creator) {
        filteredTasks = filteredTasks
          .filter((task) => task.creator.id === creator);
      }
      if (label) {
        filteredTasks = filteredTasks
          .filter((task) => task.labels
            .flat()
            .map((labelItem) => Object.entries(labelItem))
            .flat(2).includes(label));
      }

      reply.render('tasks/index', {
        filteredTasks, statuses, users, labels, objectQueryParams,
      });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preValidation: app.authenticate }, async (req, reply) => {
      const statuses = await app.objection.models.status.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      const task = new app.objection.models.task();
      reply.render('tasks/new', {
        task, statuses, users, labels,
      });
      return reply;
    })
    .get('/tasks/:id', { name: 'task', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task.query().findById(id).withGraphJoined('[creator, executor, status, labels]');
      reply.render('tasks/view', { task });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;

      const statuses = await app.objection.models.status.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      const task = await app.objection.models.task.query().findById(id).withGraphJoined('[creator, executor, status, labels]');
      reply.render('tasks/edit', {
        task, statuses, users, labels,
      });
      return reply;
    })
    .post('/tasks', { name: 'createTask', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const {
          name,
          description,
          statusId,
          executorId,
          labels,
        } = req.body.data;

        let labelsData;

        if (typeof labels === 'string') {
          labelsData = labels;
        } else {
          labelsData = !labels ? '' : labels.join(',');
        }

        const dataObj = {
          name,
          description,
          statusId: Number(statusId),
          executorId: executorId.length === 0 ? null : Number(executorId),
          creatorId: req.user.id,
          labelsId: labelsData,
        };

        const task = await app.objection.models.task.fromJson(dataObj);
        await app.objection.models.task.query().insert(task);

        // const labelsArray = labelsData.split(',');

        // labelsArray.forEach(async (labelId) => {
        //   const object = { taskId: task.id, labelId: Number(labelId) };

        //   await app.objection.models.tasklabel.query().insert(object);
        // });

        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (error) {
        const statuses = await app.objection.models.status.query();
        const users = await app.objection.models.user.query();
        const labels = await app.objection.models.label.query();

        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.code(422).render('tasks/new', {
          task: req.body.data, statuses, users, labels, errors: error.data,
        });
        return reply;
      }
    })
    .patch('/tasks/:id', { name: 'updateTask', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const {
          name,
          description,
          statusId,
          executorId,
          labels,
        } = req.body.data;

        let labelsData;
        if (typeof labels === 'string') {
          labelsData = labels.length === 0 ? '' : labels;
        } else {
          labelsData = !labels ? '' : labels.join(',');
        }

        const dataObj = {
          name,
          description,
          statusId: Number(statusId),
          executorId: executorId.length === 0 ? null : Number(executorId),
          creatorId: req.user.id,
          labelsId: labelsData,
        };

        const { id } = req.params;
        const task = await app.objection.models.task.query().findById(id).withGraphJoined('labels');
        // await app.objection.models.tasklabel.query().delete().where('task_id', '=', task.id);

        // const labelsArray = labelsData.split(',');

        // labelsArray.forEach(async (labelId) => {
        //   const object = { taskId: Number(id), labelId: Number(labelId) };

        //   await app.objection.models.tasklabel.query().insert(object);
        // });

        await task.$query().patch(dataObj);
        req.flash('info', i18next.t('flash.tasks.edit.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (error) {
        const statuses = await app.objection.models.status.query();
        const users = await app.objection.models.user.query();
        const labels = await app.objection.models.label.query();

        req.flash('error', i18next.t('flash.tasks.edit.error'));
        reply.code(422).render('tasks/edit', {
          task: req.body.data, statuses, users, labels, errors: error.data,
        });
        return reply;
      }
    })
    .delete('/tasks/:id', { name: 'deleteTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task.query().findById(id);
      if (req.user.id !== Number(task.creatorId)) {
        req.flash('error', i18next.t('flash.tasks.delete.error'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      }

      await app.objection.models.task.query().deleteById(id);
      // await app.objection.models.tasklabel.query().delete().where('task_id', '=', id);
      req.flash('info', i18next.t('flash.tasks.delete.success'));
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};
