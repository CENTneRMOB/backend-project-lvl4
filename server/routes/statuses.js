// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/statuses', { name: 'statuses', preValidation: app.authenticate }, async (req, reply) => {
      const statuses = await app.objection.models.status.query();
      reply.render('statuses/index', { statuses });
      return reply;
    })
    .get('/statuses/new', { name: 'newStatus', preValidation: app.authenticate }, async (req, reply) => {
      const status = new app.objection.models.status();
      reply.render('statuses/new', { status });
      return reply;
    })
    .get('/statuses/:id/edit', { name: 'editStatus', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;

      const status = await app.objection.models.status.query().findById(id);
      reply.render('statuses/edit', { status });
      return reply;
    })
    .post('/statuses', { name: 'createStatus', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const status = await app.objection.models.status.fromJson(req.body.data);
        await app.objection.models.status.query().insert(status);
        req.flash('info', i18next.t('flash.statuses.create.success'));
        reply.redirect('/statuses');
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.statuses.create.error'));
        reply.code(422).render('statuses/new', { status: req.body.data, errors: error.data });
        return reply;
      }
    })
    .patch('/statuses/:id', { name: 'updateStatus', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const status = await app.objection.models.status.query().findById(id);

      try {
        await status.$query().patch(req.body.data);
        req.flash('info', i18next.t('flash.statuses.edit.success'));

        reply.redirect(app.reverse('statuses'));
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.statuses.edit.error'));
        reply.code(422).render('statuses/edit', { status, errors: error.data });
        return reply;
      }
    })
    .delete('/statuses/:id', { name: 'deleteStatus', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const { statusTasks } = await app.objection.models.status.query()
        .findById(id)
        .withGraphJoined('statusTasks');

      if (statusTasks.length !== 0) {
        req.flash('error', i18next.t('flash.statuses.delete.error'));
        reply.redirect(app.reverse('statuses'));
        return reply;
      }

      await app.objection.models.status.query().deleteById(id);
      req.flash('info', i18next.t('flash.statuses.delete.success'));
      reply.redirect(app.reverse('statuses'));
      return reply;
    });
};
