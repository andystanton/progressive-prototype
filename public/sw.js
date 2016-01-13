'use strict';

importScripts('bower_components/sw-toolbox/sw-toolbox.js');

function openCache(options) {
  var cacheName;
  if (options && options.cache) {
    cacheName = options.cache.name;
  }
  cacheName = cacheName || toolbox.options.cache.name;
  return caches.open(cacheName);
}

toolbox.precache(['/', '/sw.js', '/style.css', '/posts', '/drafts', '/indexcontroller.js', '/bower_components/angular/angular.min.js', '/bower_components/bootstrap/dist/css/bootstrap.min.css', '/bower_components/bootstrap/dist/js/bootstrap.min.js', '/bower_components/jquery/dist/jquery.min.js', '/bower_components/angular-local-storage/dist/angular-local-storage.min.js', '/bower_components/material-design-icons/iconfont/MaterialIcons-Regular.eot', '/bower_components/material-design-icons/iconfontMaterialIcons-Regular.woff2', '/bower_components/material-design-icons/iconfont/MaterialIcons-Regular.woff', '/bower_components/material-design-icons/iconfont/MaterialIcons-Regular.ttf']);

toolbox.router.put('/post', function (request, values, options) {
  return fetch(request.clone()).catch(function (error) {
    return request.clone().json().then(function (contents) {
      return new Response(JSON.stringify(contents), {
        'status': 200,
        'headers': {
          'X-Online': false
        }
      });
    });
  });
});

toolbox.router.default = toolbox.networkFirst;