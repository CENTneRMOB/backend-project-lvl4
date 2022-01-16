// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const tasks = await app.objection.models.task.query().withGraphJoined('[creator, executor, status]');

      reply.render('tasks/index', { tasks });
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
    .get('/tasks/:id', { name: 'viewTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task.query().findById(id).withGraphJoined('[creator, executor, status, labels]');
      reply.render('tasks/view', { task });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      try {
        const statuses = await app.objection.models.status.query();
        const users = await app.objection.models.user.query();
        const labels = await app.objection.models.label.query();
        const task = await app.objection.models.task.query().findById(id).withGraphJoined('[creator, executor, status, labels]');
        reply.render('tasks/edit', {
          task, statuses, users, labels,
        });
        return reply;
      } catch (error) {
        reply.send(error);
        return reply;
      }
    })
    .post('/tasks', { name: 'postTask', preValidation: app.authenticate }, async (req, reply) => {
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
          labelsData = [Number(labels)];
        } else {
          labelsData = !labels ? [] : labels.map((labelId) => Number(labelId));
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

        task.labelsId
          .map((labelId) => ({ taskId: task.id, labelId }))
          .forEach(async (item) => {
            await app.objection.models.tasklabel.query().insert(item);
          });

        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (error) {
        const statuses = await app.objection.models.status.query();
        const users = await app.objection.models.user.query();
        const labels = await app.objection.models.label.query();

        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render('tasks/new', {
          task: req.body.data, statuses, users, labels, errors: error.data,
        });
        return reply;
      }
    })
    .patch('/tasks/:id', { name: 'patchTask', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const {
          name,
          description,
          statusId,
          executorId,
          labels,
        } = req.body.data;

        let labelsData;
        console.log('lslasllllllllllasllassssssssss', typeof labels);
        if (typeof labels === 'string') {
          labelsData = labels.length === 0 ? [] : [Number(labels)];
        } else {
          labelsData = !labels ? [] : labels.map((labelId) => Number(labelId));
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
        await app.objection.models.tasklabel.query().delete().where('task_id', '=', task.id);

        labelsData
          .map((labelId) => ({ taskId: Number(id), labelId }))
          .forEach(async (item) => {
            await app.objection.models.tasklabel.query().insert(item);
          });

        await task.$query().patch(dataObj);

        req.flash('info', i18next.t('flash.tasks.edit.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (error) {
        const statuses = await app.objection.models.status.query();
        const users = await app.objection.models.user.query();
        const labels = await app.objection.models.label.query();

        req.flash('error', i18next.t('flash.tasks.edit.error'));
        reply.render('tasks/new', {
          task: req.body.data, statuses, users, labels, errors: error.data,
        });
        return reply;
      }
    })
    .delete('/tasks/:id', { name: 'deleteTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task.query().findById(id);
      const userId = req.user.id;
      if (userId !== Number(task.creatorId)) {
        req.flash('error', i18next.t('flash.tasks.delete.error'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      }
      try {
        await app.objection.models.task.query().deleteById(id);
        await app.objection.models.tasklabel.query().delete().where('task_id', '=', id);
        req.flash('info', i18next.t('flash.tasks.delete.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (error) {
        reply.send(error);
        return reply;
      }
    });
};
