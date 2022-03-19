// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/labels', { name: 'labels', preValidation: app.authenticate }, async (req, reply) => {
      const labels = await app.objection.models.label.query();
      reply.render('labels/index', { labels });
      return reply;
    })
    .get('/labels/new', { name: 'newLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = new app.objection.models.label();
      reply.render('labels/new', { label });
      return reply;
    })
    .get('/labels/:id/edit', { name: 'editLabel', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;

      const label = await app.objection.models.label.query().findById(id);
      reply.render('labels/edit', { label });
      return reply;
    })
    .post('/labels', { name: 'createLabel', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const label = await app.objection.models.label.fromJson(req.body.data);
        await app.objection.models.label.query().insert(label);
        req.flash('info', i18next.t('flash.labels.create.success'));
        reply.redirect('/labels');
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.labels.create.error'));
        reply.code(422).render('labels/new', { label: req.body.data, errors: error.data });
        return reply;
      }
    })
    .patch('/labels/:id', { name: 'updateLabel', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const label = await app.objection.models.label.query().findById(id);

      try {
        await label.$query().patch(req.body.data);
        req.flash('info', i18next.t('flash.labels.edit.success'));

        reply.redirect(app.reverse('labels'));
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.labels.edit.error'));
        reply.code(422).render('labels/edit', { label, errors: error.data });
        return reply;
      }
    })
    .delete('/labels/:id', { name: 'deleteLabel', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const { labeledTasks } = await app.objection.models.label.query()
        .findById(id)
        .withGraphJoined('labeledTasks');

      if (labeledTasks.length !== 0) {
        req.flash('error', i18next.t('flash.labels.delete.error'));
        reply.redirect('/labels');
        return reply;
      }

      await app.objection.models.label.query().deleteById(id);
      req.flash('info', i18next.t('flash.labels.delete.success'));
      reply.redirect('/labels');
      return reply;
    });
};
