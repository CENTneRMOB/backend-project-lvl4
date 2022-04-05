// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const statuses = await app.objection.models.status.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();

      const params = req.query;

      const {
        status,
        executor,
        label,
        isCreatorUser,
      } = params;

      const tasks = await app.objection.models.task.query()
        .modify('byStatus', status)
        .modify('byExecutor', executor)
        .modify('byCreator', isCreatorUser, req.user.id)
        .modify('byLabel', label, app.objection);

      reply.render('tasks/index', {
        tasks, statuses, users, labels, params,
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
      const task = await app.objection.models.task.query()
        .findById(id)
        .withGraphJoined('[creator, executor, status, labels]');

      reply.render('tasks/view', { task });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;

      const statuses = await app.objection.models.status.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      const task = await app.objection.models.task.query()
        .findById(id)
        .withGraphJoined('[creator, executor, status, labels]');

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

        const [...labelsFromDB] = !labels ? [] : await app.objection.models.label.query()
          .findByIds(labels);

        const labelsIds = labelsFromDB.map((label) => label.id);

        const newTask = {
          name,
          description,
          statusId: Number(statusId),
          executorId: !executorId ? null : Number(executorId),
          creatorId: req.user.id,
          labelsId: labelsIds,
        };

        const Task = await app.objection.models.task;
        const task = await Task.fromJson(newTask);

        await Task.query().insert(task);
        if (labelsIds.length !== 0) {
          await Task.relatedQuery('labels')
            .for(
              Task.query()
                .where('id', task.id)
                .limit(1),
            )
            .relate(labelsIds);
        }

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

        const [...labelsFromDB] = !labels ? [] : await app.objection.models.label.query()
          .findByIds(labels);

        const labelsIds = labelsFromDB.map((label) => label.id);

        const taskUpdate = {
          name,
          description,
          statusId: Number(statusId),
          executorId: !executorId ? null : Number(executorId),
          creatorId: req.user.id,
          labelsId: labelsIds,
        };

        const { id } = req.params;
        const Task = await app.objection.models.task;
        const task = await Task.query().findById(id);
        await task.$query().patch(taskUpdate);

        if (labelsIds.length !== 0) {
          await Task.relatedQuery('labels')
            .for(id)
            .unrelate();

          await Task.relatedQuery('labels')
            .for(
              Task.query()
                .where('id', task.id)
                .limit(1),
            )
            .relate(labelsIds);
        }

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

      const Task = app.objection.models.task;

      await Task.relatedQuery('labels')
        .for(id)
        .unrelate();
      await Task.query().deleteById(id);

      req.flash('info', i18next.t('flash.tasks.delete.success'));
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};
