importScripts('bower_components/sw-toolbox/sw-toolbox.js');

// borrowed from sw-toolbox
function openCache(options) {
  var cacheName;
  if (options && options.cache) {
    cacheName = options.cache.name;
  }
  cacheName = cacheName || toolbox.options.cache.name;

  // console.log('Opening cache "' + cacheName + '"', options);
  return caches.open(cacheName);
}


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
  return fetch(request.clone())
    .then(response => {
      console.log("ONLINE")
      request.clone().json().then(offlinePost => {
        var targetEndpoint;
        if (offlinePost.state == 'published') {
          targetEndpoint = '/offlineposts'
        } else {
          targetEndpoint = '/offlinedrafts'
        }
        return openCache(options).then(cache =>
          cache.match(new Request(targetEndpoint)).then(cached => {
            if (cached) {
              return cached.json().then(offlinePosts => {
                offlinePosts = offlinePosts.filter(post => post._tmpId != offlinePost._tmpId)
                var newResponse = new Response(
                  JSON.stringify(offlinePosts), {
                    "status": 200,
                    "headers": {
                      "X-Online": false
                    }
                  });
                return cache.put(new Request(targetEndpoint), newResponse)
              }).then(() => response);
            } else {
              return response;
            }
          }));
      });

      return response;
    })
    .catch(error =>
      request.clone().json().then(offlinePost => {
        var targetEndpoint;
        if (offlinePost.state == 'published') {
          targetEndpoint = '/offlineposts'
        } else {
          targetEndpoint = '/offlinedrafts'
        }
        return openCache(options).then(cache =>
          cache.match(new Request(targetEndpoint)).then(cached => {
            var offlinePostsPromise;
            if (cached) {
              offlinePostsPromise = cached.json();
            } else {
              offlinePostsPromise = Promise.resolve([]);
            }
            return offlinePostsPromise.then(offlinePosts =>
              openCache(options).then(cache => {
                offlinePosts = offlinePosts.filter(post => post._tmpId != offlinePost._tmpId)
                offlinePosts.push(offlinePost);
                console.log(offlinePosts)
                var newResponse = new Response(
                  JSON.stringify(offlinePosts), {
                    "status": 200,
                    "headers": {
                      "X-Online": false
                    }
                  });
                cache.put(new Request(targetEndpoint), newResponse.clone())
                return newResponse;
              }))
          }))
      }));
});

toolbox.router.get('/offlineposts', (request, values, options) => {
  return openCache(options).then(cache => cache.match(request)).then(content => {
    if (!content) {
      // console.log("returning new response")
      var response = new Response(JSON.stringify([]), {
        "status": 200
      })
      return openCache(options).then(cache => cache.put(request, response.clone())).then(() => response);
    } else {
      // console.log("returning cached response")
      return content
    }
  })
});

toolbox.router.get('/offlinedrafts', (request, values, options) => {
  return openCache(options).then(cache => cache.match(request)).then(content => {
    if (!content) {
      // console.log("returning new response")
      var response = new Response(JSON.stringify([]), {
        "status": 200
      })
      return openCache(options).then(cache => cache.put(request, response.clone())).then(() => response);
    } else {
      // console.log("returning cached response")
      return content
    }
  })
});

toolbox.router.default = toolbox.networkFirst;
