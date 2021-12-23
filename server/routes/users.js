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
      console.log('NEWUSER: ', user);
      reply.render('users/new', { user });
      return reply;
    })
    .get('/users/:id/edit', async (req, reply) => {
      const { id } = req.params;
      try {
        const user = await app.objection.models.user.query().findById(id);
        console.log('USER EDIT: ', user);
        console.log(typeof id);
        reply.render('users/edit', { user });
        return reply;
      } catch (e) {
        reply.send(e);
        return reply;
      }
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
      try {
        const { id } = req.params;
        // console.log()
        // const user = await app.objection.models.user.query().findById(id);
        reply.send('hello ,world');
        return reply;
      } catch (error) {
        reply.send(error);
        return reply;
      }
    })
    .delete('/users/:id', async (req, reply) => {
      const { id } = req.params;
      await app.objection.models.user.query().deleteById(id);
      // reply.send('User was deleted!');
      reply.redirect(app.reverse('users'));
      return reply;
    });
};
