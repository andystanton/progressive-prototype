"use strict"

// initialise service worker

if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(function(registration) {
      console.log("Service Worker Registered");
    });

  navigator.serviceWorker.ready.then(registration => {
    console.log("Service Worker Ready");
  });
}

class PostModel {
  constructor() {
    this._posts = {
      offline: {},
      online: {}
    };
    this._drafts = {
      offline: {},
      online: {}
    };
  }

  get drafts() {
    return this._drafts;
  }

  get posts() {
    return this._posts;
  }

  set drafts(drafts) {
    this._drafts = drafts;
  }

  set posts(posts) {
    this._posts = posts;
  }

  addPost(post, online) {
    if (online) {
      this._posts.online[post._id] = post;
    } else {
      this._posts.offline[post._tmpId] = post;
    }
  }

  addDraft(post, online) {
    if (online) {
      this._drafts.online[post._id] = post;
    } else {
      this._drafts.offline[post._tmpId] = post;
    }
  }

  addPosts(posts, online) {
    posts.forEach(p => this.addPost(p, online))
  }

  addDrafts(posts, online) {
    posts.forEach(p => this.addDraft(p, online))
  }

  containsPost(id, online) {
    if (online) {
      return this._posts.online[id];
    } else {
      return this._posts.offline[id];
    }
  }

  containsDraft(id, online) {
    if (online) {
      return this._drafts.online[id];
    } else {
      return this._drafts.offline[id];
    }
  }

  removePost(post, online) {
    if (online) {
      if (this.containsPost(post._id, online)) {
        delete this._posts.online[post._id];
      }
    } else {
      if (this.containsPost(post._tmpId, offline)) {
        delete this._posts.offline[post._tmpId]
      }
    }
  }

  removeDraft(post, online) {
    if (online) {
      if (this.containsDraft(post._id, online)) {
        delete this._drafts.online[post._id]
      }
    } else {
      if (this.containsDraft(post._tmpId, offline)) {
        delete this._drafts.offline[post._tmpId]
      }
    }
  }
}

function S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

function guid() {
  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}

var app = angular.module('myApp', []);
var socket = io();

app.controller('posts', ($scope, $http, $timeout) => {
  $scope.postModel = new PostModel();

  (function tick() {
    $http.get("http://localhost:3000/posts")
      .then(response => {
        $scope.postModel.addPosts(response.data, JSON.parse(response.headers('X-Online')));
      });
    $http.get("http://localhost:3000/drafts")
      .then(response => {
        $scope.postModel.addDrafts(response.data, JSON.parse(response.headers('X-Online')));
      });
    //- socket.emit('test channel', "ping");
    $timeout(tick, 1000);
  })();

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

  $scope.savePost = (post) => {
    console.log(`saving ${post.title}`);
    console.log(post);
    var writePost = JSON.parse(JSON.stringify(post));
    if ('_tmpId' in writePost) {
      delete writePost['_tmpId'];
    }
    $http.put("/post", writePost).then(response => {
      var online = JSON.parse(response.headers('X-Online'));
      console.log(online)
      if (online && post._tmpId) {
        $scope.postModel.removeDraft(post._tmpId, false)
      }
    });
    if ($scope.mode == 'new') {
      $scope.newPost()
    }
  }

  $scope.publishPost = (post) => {
    console.log(`publishing ${post.title}`);
    console.log(post);
    post.state = 'published';
    $http.put("/post", post).then(response => {
      var online = response.headers('X-Online');
      console.log(online)
      $scope.postModel.removeDraft(post, online)
    });
    if ($scope.mode == 'new') {
      $scope.newPost()
    }
  }

  $scope.withdrawPost = (post) => {
    console.log(`withdrawing ${post.title}`);
    console.log(post);
    post.state = 'draft';
    $http.put("/post", post).then((response) => {
      var online = response.headers('X-Online');
      console.log(online)
      $scope.postModel.removePost(post, online)
    });
    if ($scope.mode == 'new') {
      $scope.newPost()
    }
  }

  $scope.deletePost = (post) => {
    console.log(`deleting ${post._id}`)
    $http.delete(`/post/${post._id}`).then((response) => {
      var online = response.headers('X-Online');
      console.log(online)
      $scope.postModel.removeDraft(post, online)
      $scope.postModel.removePost(post, online)
    });
    $scope.newPost()
  }
});
