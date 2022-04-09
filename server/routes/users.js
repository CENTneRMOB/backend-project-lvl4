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
    .get('/users/:id/edit', { name: 'editUser', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      if (req.user.id !== Number(id)) {
        req.flash('error', i18next.t('flash.users.permissionDenied'));
        reply.redirect(app.reverse('users'));
        return reply;
      }

      const user = await app.objection.models.user.query().findById(id);
      reply.render('users/edit', { user });
      return reply;
    })
    .post('/users', { name: 'createUser' }, async (req, reply) => {
      try {
        const user = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(user);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.code(422).render('users/new', { user: req.body.data, errors: error.data });
        return reply;
      }
    })
    .patch('/users/:id', { name: 'updateUser', preValidation: app.authenticate }, async (req, reply) => {
      // console.log('REQ PARAMS+body!!!: ', req.params, req.body);
      // const users = await app.objection.models.user.query();
      // console.log('USERS: ', users);
      const { id } = req.params;
      if (req.user.id !== Number(id)) {
        req.flash('error', i18next.t('flash.users.permissionDenied'));
        reply.redirect(app.reverse('users'));
        return reply;
      }

      const user = await app.objection.models.user.query().findById(id);
      try {
        await user.$query().patch(req.body.data);
        req.flash('info', i18next.t('flash.users.edit.success'));

        reply.redirect(app.reverse('users'));
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.users.edit.error'));
        // console.log(error);
        reply.code(422).render('users/edit', { user, errors: error.data });
        return reply;
      }
    })
    .delete('/users/:id', { name: 'deleteUser', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      if (req.user.id !== Number(id)) {
        req.flash('error', i18next.t('flash.users.permissionDenied'));
        reply.redirect(app.reverse('users'));
        return reply;
      }

      const { createdTasks, executedTasks } = await app.objection.models.user.query()
        .findById(id)
        .withGraphJoined('[createdTasks, executedTasks]');

      if (createdTasks.length !== 0 || executedTasks.length !== 0) {
        req.flash('error', i18next.t('flash.users.delete.error'));
        reply.redirect(app.reverse('users'));
        return reply;
      }

      try {
        await app.objection.models.user.query().deleteById(id);
        req.logout();
        req.flash('info', i18next.t('flash.users.delete.success'));
        reply.redirect(app.reverse('users'));
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.users.delete.error'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
    });
};
