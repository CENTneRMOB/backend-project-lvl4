// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/statuses', { name: 'statuses' }, async (req, reply) => {
      const statuses = await app.objection.models.status.query();
      reply.render('statuses/index', { statuses });
      return reply;
    })
    .get('/statuses/new', { name: 'newStatus' }, async (req, reply) => {
      const status = new app.objection.models.status();
      reply.render('statuses/new', { status });
      return reply;
    })
    .get('/statuses/:id/edit', { name: 'editStatus' }, async (req, reply) => {
      const { id } = req.params;
      try {
        const status = await app.objection.models.status.query().findById(id);
        reply.render('statuses/edit', { status });
        return reply;
      } catch (error) {
        reply.send(error);
        return reply;
      }
    })
    .post('/statuses', { name: 'postStatus' }, async (req, reply) => {
      try {
        const status = await app.objection.models.status.fromJson(req.body.data);
        // status.userId = req.user.id;
        await app.objection.models.status.query().insert(status);
        req.flash('info', i18next.t('flash.statuses.create.success'));
        reply.redirect('/statuses');
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.statuses.create.error'));
        reply.render('statuses/new', { status: req.body.data, errors: error.data });
        return reply;
      }
    })
    .patch('/statuses/:id', { name: 'patchStatus' }, async (req, reply) => {
      const inputData = req.body.data;
      const { id } = req.params;
      const status = await app.objection.models.status.query().findById(id);

      try {
        await status.$query().patch(inputData);
        req.flash('info', i18next.t('flash.statuses.edit.success'));

        reply.redirect(app.reverse('statuses'));
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.statuses.edit.error'));
        reply.render('statuses/edit', { status, errors: error.data });
        return reply;
      }
    })
    .delete('/statuses/:id', { name: 'deleteStatus' }, async (req, reply) => {
      const { id } = req.params;
      // const userId = req.user.id;
      const status = await app.objection.models.status.query().findById(id);
      // if (userId !== status.userId) {
      //   req.flash('error', i18next.t('flash.statuses.delete.error'));
      //   reply.redirect(app.reverse('statuses'));
      //   return reply;
      // }

      try {
        await app.objection.models.status.query().deleteById(id);
        req.flash('info', i18next.t('flash.statuses.delete.success'));
        reply.redirect(app.reverse('statuses'));
        return reply;
      } catch (error) {
        reply.send(error);
        return reply;
      }
    });
};
