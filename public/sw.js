importScripts('bower_components/sw-toolbox/sw-toolbox.js');

toolbox.precache([
  '/',
  '/sw.js',
  '/posts',
  '/drafts',
  '/bower_components/angular/angular.min.js',
  '/bower_components/bootstrap/dist/css/bootstrap.min.css',
  '/bower_components/bootstrap/dist/js/bootstrap.min.js',
  '/bower_components/jquery/dist/jquery.min.js'
]);

toolbox.router.default = toolbox.networkFirst;
