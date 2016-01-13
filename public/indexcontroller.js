"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (registration) {
    return console.log("Service Worker Registered");
  });

  navigator.serviceWorker.ready.then(function (registration) {
    return console.log("Service Worker Ready");
  });
}

var PostModel = function PostModel(id) {
  _classCallCheck(this, PostModel);

  this.id = id;
  this.posts = {};
  this.drafts = {};
};

function addPost(postModel, post) {
  postModel.posts[post[postModel.id]] = post;
}

function addPosts(postModel, posts) {
  postModel.posts = {};
  posts.forEach(function (post) {
    return addPost(postModel, post);
  });
}

function addDraft(postModel, draft) {
  postModel.drafts[draft[postModel.id]] = draft;
}

function addDrafts(postModel, drafts) {
  postModel.drafts = {};
  drafts.forEach(function (draft) {
    return addDraft(postModel, draft);
  });
}

function guid() {
  function S4() {
    return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
  }

  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}

var app = angular.module('myApp', ['LocalStorageModule']);

app.filter('orderObjectBy', function () {
  return function (items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function (item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return a[field] > b[field] ? 1 : -1;
    });
    if (reverse) filtered.reverse();
    return filtered;
  };
});

app.config(function (localStorageServiceProvider) {
  return localStorageServiceProvider.setPrefix('progressive-prototype');
});

app.controller('posts', function ($scope, $http, $timeout, localStorageService) {
  $scope.syncPosts = function (postType) {
    return Promise.all(Object.keys(localStorageService.get("offlinePostModel")[postType]).map(function (key) {
      var draft = localStorageService.get("offlinePostModel")[postType][key];
      return $scope.savePost(draft, true).then(function (online) {
        if (online) $scope.updatePostModel(function (postModel) {
          return delete postModel[postType][key];
        });
      });
    }));
  };

  $scope.newPost = function () {
    $scope.editpost = {
      state: 'draft'
    };
    $scope.mode = 'new';
  };

  $scope.selectPost = function (post) {
    $scope.editpost = JSON.parse(JSON.stringify(post));
    $scope.mode = 'edit';
  };

  $scope.savePost = function (post, isSync) {
    if (!('_tmpId' in post)) post._tmpId = guid();
    if (!isSync) post.updated = new Date().toJSON();

    return $http.put("/post", post).then(function (response) {
      var online = JSON.parse(response.headers('X-Online'));
      if ($scope.mode == 'new' && (!isSync || online)) {
        $scope.newPost();
      }
      if (!online) $scope.updatePostModel(function (postModel) {
        if (post.state == 'published') {
          addPost(postModel, post);
        } else {
          addDraft(postModel, post);
        }
      });
      return online;
    });
  };

  $scope.publishPost = function (post) {
    post.state = 'published';
    $scope.savePost(post);
  };

  $scope.withdrawPost = function (post) {
    post.state = 'draft';
    $scope.savePost(post);
  };

  $scope.deletePost = function (post) {
    console.log('deleting ' + post._id);
    $http.delete('/post/' + post._id);
    $scope.newPost();
  };

  $scope.updatePostModel = function (update) {
    var postModel = localStorageService.get("offlinePostModel");
    update(postModel);
    localStorageService.set("offlinePostModel", postModel);
    $scope.offlinePostModel = postModel;
  };

  $scope.tick = function () {
    Promise.all([$http.get("http://localhost:3000/posts").then(function (response) {
      addPosts($scope.postModel, response.data);
    }), $http.get("http://localhost:3000/drafts").then(function (response) {
      addDrafts($scope.postModel, response.data);
    })]).then(function () {
      return $scope.syncPosts("drafts");
    }).then(function () {
      return $scope.syncPosts("posts");
    }).catch(function (error) {
      return console.log("something went wrong: " + error);
    }).then(function () {
      return $timeout($scope.tick, 500);
    });
  };

  $scope.initialiseModel = function () {
    var offlinePostModel = localStorageService.get("offlinePostModel");
    if (!offlinePostModel) offlinePostModel = new PostModel("_tmpId");
    localStorageService.set("offlinePostModel", offlinePostModel);

    $scope.postModel = new PostModel("_id");
    $scope.offlinePostModel = offlinePostModel;
  };

  $scope.initialiseModel();
  $scope.tick();
});