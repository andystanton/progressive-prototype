"use strict"

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(registration => console.log("Service Worker Registered"));

  navigator.serviceWorker.ready
    .then(registration => console.log("Service Worker Ready"));
}

class PostModel {
  constructor(id) {
    this.id = id;
    this.posts = {};
    this.drafts = {};
  }
}

function addPost(postModel, post) {
  postModel.posts[post[postModel.id]] = post;
}

function addPosts(postModel, posts) {
  postModel.posts = {}
  posts.forEach(post => addPost(postModel, post))
}

function addDraft(postModel, draft) {
  postModel.drafts[draft[postModel.id]] = draft;
}

function addDrafts(postModel, drafts) {
  postModel.drafts = {}
  drafts.forEach(draft => addDraft(postModel, draft))
}

function guid() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }

  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}

var app = angular.module('mori', ['LocalStorageModule']);

app.filter('orderObjectBy', () => {
  return (items, field, reverse) => {
    var filtered = [];
    angular.forEach(items, (item) => filtered.push(item));
    filtered.sort((a, b) => (a[field] > b[field] ? 1 : -1));
    if (reverse) filtered.reverse();
    return filtered;
  };
});

app.config(localStorageServiceProvider => localStorageServiceProvider.setPrefix('progressive-prototype'));

app.controller('posts', ($scope, $http, $timeout, localStorageService) => {
  $scope.syncPosts = (postType) => {
    return Promise.all(Object.keys(localStorageService.get("offlinePostModel")[postType]).map(key => {
      var draft = localStorageService.get("offlinePostModel")[postType][key];
      return $scope.savePost(draft, true).then(online => {
        if (online) $scope.updatePostModel(postModel => delete postModel[postType][key]);
      })
    }));
  }

  $scope.newPost = () => {
    $scope.editpost = {
      state: 'draft'
    };
    $scope.mode = 'new';
  }

  $scope.selectPost = (post) => {
    $scope.editpost = JSON.parse(JSON.stringify(post));
    $scope.mode = 'edit';
  }

  $scope.savePost = (post, isSync) => {
    if (!('_tmpId' in post)) post._tmpId = guid();
    if (!isSync) post.updated = new Date().toJSON();

    return $http.put("/post", post).then(response => {
      var online = JSON.parse(response.headers('X-Online'));
      if ($scope.mode == 'new' && (!isSync || online)) {
        $scope.newPost()
      }
      if (!online) $scope.updatePostModel(postModel => {
        if (post.state == 'published') {
          addPost(postModel, post)
        } else {
          addDraft(postModel, post)
        }
      });
      return online;
    });
  }

  $scope.publishPost = (post) => {
    post.state = 'published';
    $scope.savePost(post)
  }

  $scope.withdrawPost = (post) => {
    post.state = 'draft';
    $scope.savePost(post);
  }

  $scope.deletePost = (post) => {
    console.log(`deleting ${post._id}`)
    $http.delete(`/post/${post._id}`);
    $scope.newPost()
  }

  $scope.updatePostModel = (update) => {
    var postModel = localStorageService.get("offlinePostModel");
    update(postModel);
    localStorageService.set("offlinePostModel", postModel);
    $scope.offlinePostModel = postModel;
  }

  $scope.tick = () => {
    Promise.all([
        $http.get("http://localhost:3000/posts")
        .then(response => {
          addPosts($scope.postModel, response.data);
        }),
        $http.get("http://localhost:3000/drafts")
        .then(response => {
          addDrafts($scope.postModel, response.data);
        }),
      ])
      .then(() => $scope.syncPosts("drafts"))
      .then(() => $scope.syncPosts("posts"))
      .catch(error => console.log("something went wrong: " + error))
      .then(() => $timeout($scope.tick, 500));
  };

  $scope.initialiseModel = () => {
    var offlinePostModel = localStorageService.get("offlinePostModel")
    if (!offlinePostModel) offlinePostModel = new PostModel("_tmpId");
    localStorageService.set("offlinePostModel", offlinePostModel);

    $scope.postModel = new PostModel("_id");
    $scope.offlinePostModel = offlinePostModel;
  };

  $scope.initialiseModel();
  $scope.tick();
});
