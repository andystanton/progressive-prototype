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

toolbox.router.put('/post', (request, values, options) => {
    console.log("intercepted network first");
    return fetch(request)
    .then(response => {
      console.log("ONLINE")
      return response;
    })
    .catch(error => {
      console.log("OFFLINE")
      return new Response(request.body, {
        'headers': {
          'X-Online': false
        }
      });
    });
  });


toolbox.router.default = toolbox.networkFirst;
