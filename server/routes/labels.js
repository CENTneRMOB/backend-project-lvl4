// @ts-check

import i18next from 'i18next';
import Rollbar from 'rollbar';

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_KEY,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

export default (app) => {
  app
    .get('/labels', { name: 'labels', preValidation: app.authenticate }, async (req, reply) => {
      try {
        throw new Error('hi there');
        // const labels = await app.objection.models.label.query();
        // reply.render('labels/index', { labels });
        // return reply;
      } catch (error) {
        rollbar.log(error.message);
        reply.send(error);
        return reply;
      }
    })
    .get('/labels/new', { name: 'newLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = new app.objection.models.label();
      reply.render('labels/new', { label });
      return reply;
    })
    .get('/labels/:id/edit', { name: 'editLabel', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      try {
        const label = await app.objection.models.label.query().findById(id);
        reply.render('labels/edit', { label });
        return reply;
      } catch (error) {
        reply.send(error);
        return reply;
      }
    })
    .post('/labels', { name: 'postLabel', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const label = await app.objection.models.label.fromJson(req.body.data);
        await app.objection.models.label.query().insert(label);
        req.flash('info', i18next.t('flash.labels.create.success'));
        reply.redirect('/labels');
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.labels.create.error'));
        reply.render('labels/new', { label: req.body.data, errors: error.data });
        return reply;
      }
    })
    .patch('/labels/:id', { name: 'patchLabel', preValidation: app.authenticate }, async (req, reply) => {
      const inputData = req.body.data;
      const { id } = req.params;
      const label = await app.objection.models.label.query().findById(id);

      try {
        await label.$query().patch(inputData);
        req.flash('info', i18next.t('flash.labels.edit.success'));

        reply.redirect(app.reverse('labels'));
        return reply;
      } catch (error) {
        req.flash('error', i18next.t('flash.labels.edit.error'));
        reply.render('labels/edit', { label, errors: error.data });
        return reply;
      }
    })
    .delete('/labels/:id', { name: 'deleteLabel', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const { taskLabel } = await app.objection.models.label.query().findById(id).withGraphJoined('[taskLabel]');
      if (taskLabel.length !== 0) {
        req.flash('error', i18next.t('flash.labels.delete.error'));
        reply.redirect('/labels');
        return reply;
      }
      try {
        await app.objection.models.label.query().deleteById(id);
        req.flash('info', i18next.t('flash.labels.delete.success'));
        reply.redirect('/labels');
        return reply;
      } catch (error) {
        reply.send(error);
        return reply;
      }
    });
};
