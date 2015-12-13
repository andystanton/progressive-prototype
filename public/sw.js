var cacheVersion = "v1"

self.addEventListener('install', event => event.waitUntil(
  caches.open(cacheVersion).then(cache =>
    cache.addAll([
      '/',
      '/sw.js',
      '/posts',
      '/bower_components/angular/angular.js',
      '/bower_components/angular/angular.min.js',
      '/bower_components/bootstrap/dist/css/bootstrap.min.css',
      '/bower_components/bootstrap/dist/js/bootstrap.min.js',
      '/bower_components/jquery/dist/jquery.min.js'
    ]).then(() =>
      self.skipWaiting()
    )
  )
));

self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => event.respondWith(
  Promise.all([
    caches.open(cacheVersion),
    fetch(event.request)
  ]).then(values => {
    var cache = values[0];
    var response = values[1].clone();
    console.log(`caching ${event.request.url}`)
    cache.put(event.request, values[1])
    return response
  }).catch(error => {
    console.log(`fetch error: ${error}`)
    return caches.open(cacheVersion).then(cache => cache.match(event.request))
  })
));
