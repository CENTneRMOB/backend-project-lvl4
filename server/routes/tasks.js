// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      const tasks = await app.objection.models.task.query().withGraphJoined('[creator, executor, status]');

      reply.render('tasks/index', { tasks });
      // reply.send({ tasks });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask' }, async (req, reply) => {
      const statuses = await app.objection.models.status.query();
      const users = await app.objection.models.user.query();
      const task = new app.objection.models.task();
      reply.render('tasks/new', { task, statuses, users });
      // reply.send({ hello: 'new' });
      return reply;
    })
    .get('/tasks/:id', { name: 'viewTask' }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task.query().findById(id).withGraphJoined('[creator, executor, status]');
      reply.render('tasks/view', { task });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask' }, async (req, reply) => {
      const { id } = req.params;
      try {
        const statuses = await app.objection.models.status.query();
        const users = await app.objection.models.user.query();
        const task = await app.objection.models.task.query().findById(id).withGraphJoined('[creator, executor, status]');
        reply.render('tasks/edit', { task, statuses, users });
        // reply.send(task);
        return reply;
      } catch (error) {
        reply.send(error);
        return reply;
      }
    })
    .post('/tasks', { name: 'postTask' }, async (req, reply) => {
      const {
        name,
        description,
        status,
        executor,
      } = req.body.data;

      const dataObj = {
        name,
        description,
        statusId: Number(status),
        executorId: Number(executor),
        creatorId: req.user.id,
      };

      try {
        const task = await app.objection.models.task.fromJson(dataObj);
        await app.objection.models.task.query().insert(task);
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect('/tasks');
        return reply;
      } catch (error) {
        reply.send(error);
        return reply;
      }
      // reply.send(dataObj);
      // return reply;
    })
    .patch('/tasks/:id', { name: 'patchTask' }, async (req, reply) => {
      const {
        name,
        description,
        status,
        executor,
      } = req.body.data;
      const dataObj = {
        name,
        description,
        statusId: Number(status),
        executorId: Number(executor),
        creatorId: req.user.id,
      };
      const { id } = req.params;
      const task = await app.objection.models.task.query().findById(id);

      try {
        await task.$query().patch(dataObj);
        req.flash('info', i18next.t('flash.tasks.edit.success'));

        reply.redirect(app.reverse('tasks'));
        // reply.send({ hello: 'patch' });
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.tasks.edit.error'));
        reply.render('tasks/edit', { status, errors: error.data });
        return reply;
      }
    })
    .delete('/tasks/:id', { name: 'deleteTask' }, async (req, reply) => {
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
        req.flash('info', i18next.t('flash.tasks.delete.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (error) {
        reply.send(error);
        return reply;
      }
      // reply.send({ hello: 'delete' });
      // return reply;
    });
};
