// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
      return reply;
    })
    .get('/users/:id/edit', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      if (req.user.id === Number(id)) {
        try {
          const user = await app.objection.models.user.query().findById(id);
          reply.render('users/edit', { user });
          return reply;
        } catch (e) {
          reply.send(e);
          return reply;
        }
      }

      req.flash('error', i18next.t('flash.wrongAuth'));
      reply.redirect(app.reverse('users'));
      return reply;
    })
    .post('/users', async (req, reply) => {
      try {
        const user = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(user);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (e) {
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user: req.body.data, errors: e.data });
        return reply;
      }
    })
    .patch('/users/:id', { name: 'editUser' }, async (req, reply) => {
      const updatedUser = req.body.data;
      const { id } = req.params;
      const user = await app.objection.models.user.query().findById(id);

      try {
        await user.$query().patch(updatedUser);
        req.flash('info', i18next.t('flash.users.edit.success'));

        reply.redirect(app.reverse('users'));
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.users.edit.error'));
        reply.render('users/edit', { user, errors: error.data });
        return reply;
      }
    })
    .delete('/users/:id', { name: 'deleteUser', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const { taskCreator, taskExecutor } = await app.objection.models.user.query().findById(id).withGraphJoined('[taskCreator, taskExecutor]');
      if (taskCreator.length !== 0 || taskExecutor.length !== 0) {
        req.flash('error', i18next.t('flash.users.delete.error'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
      if (req.user.id === Number(id)) {
        try {
          await app.objection.models.user.query().deleteById(id);
          req.flash('info', i18next.t('flash.users.delete.success'));
          reply.redirect(app.reverse('users'));
          return reply;
        } catch (error) {
          req.flash('error', i18next.t('flash.users.delete.error'));
          reply.redirect(app.reverse('users'));
          return reply;
        }
      }

      req.flash('error', i18next.t('flash.wrongAuth'));
      reply.redirect(app.reverse('users'));
      return reply;
    });
};
