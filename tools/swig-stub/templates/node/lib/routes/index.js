module.exports = function (app, router) {

  return {
    get: {
      '': function* checkout(next, controller, locals) {
        locals.metaData = locals.metaData || {};
        locals.metaData.title = 'Gilt Web App';

        this.body = 'Gilt Web App';
      }
    }
  };
};
