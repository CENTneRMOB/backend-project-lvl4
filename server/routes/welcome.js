// @ts-check

export default (app) => {
  app
    // .get('/', { name: 'root' }, (req, reply) => {
    //   reply.render('welcome/index');
    // })
    .get('/', { name: 'root' }, (req, reply) => {
      reply.render('welcome/index2');
    })
    .get('/protected', { name: 'protected', preValidation: app.authenticate }, (req, reply) => {
      reply.render('welcome/index');
    });
};
