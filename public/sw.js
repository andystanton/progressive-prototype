importScripts('bower_components/sw-toolbox/sw-toolbox.js');

toolbox.precache([
  '/',
  '/sw.js',
  '/posts',
  '/drafts',
  '/indexcontroller.js',
  '/socket.io/socket.io.js',
  '/bower_components/angular/angular.min.js',
  '/bower_components/bootstrap/dist/css/bootstrap.min.css',
  '/bower_components/bootstrap/dist/js/bootstrap.min.js',
  '/bower_components/jquery/dist/jquery.min.js'
]);

toolbox.router.get('/socket.io', (request, values, options) => {
  if (request.url.match(/\/socket\.io\/socket\.io\.js$/)) {
    // TODO: handle long polling
    console.log(`intercepted socket.io long polling request on: ${request.url}`)
  }
  return fetch(request).catch(error => console.log(error))
})

toolbox.router.put('/post', (request, values, options) => {
  console.log("intercepted network first");
  return fetch(request)
    .then(response => {
      console.log("ONLINE")
      return response;
    })
    .catch(error => {
      return new Response(request.body, {
        'headers': {
          'X-Online': false
        }
      });
    });
});


toolbox.router.default = toolbox.networkFirst;
