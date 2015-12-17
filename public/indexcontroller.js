"use strict"

// initialise service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })
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

  addOnlinePost(post) {
    this._posts.online[post._id] = post;
  }

  addOfflinePost(post) {
    this._posts.offline[post._tmpId] = post;
  }

  addOnlinePosts(posts) {
    posts.forEach(post => this.addOnlinePost(post))
  }

  addOfflinePosts(posts) {
    posts.forEach(post => this.addOfflinePost(post))
  }

  addOnlineDraft(post) {
    this._drafts.online[post._id] = post;
  }

  addOfflineDraft(post) {
    // console.log(`adding offline draft with tmpId: ${post._tmpId}`)
    this._drafts.offline[post._tmpId] = post;
  }

  addOnlineDrafts(posts) {
    posts.forEach(post => this.addOnlineDraft(post))
  }

  addOfflineDrafts(posts) {
    // console.log(`adding offline drafts`)
    // console.log(JSON.stringify(posts))
    var keepers = Object.keys(this._drafts.offline).filter(tmpId => {
      posts.find(post => post._tmpId == tmpId)
    });
    Object.keys(this._drafts.offline).forEach(tmpId => {
      if (!keepers.find(x => x == tmpId)) {
        // if (!posts.find(post => post._tmpId == tmpId)) {
        delete(this._drafts.offline[tmpId])
      }
    })
    posts.forEach(post => this.addOfflineDraft(post))
  }
}

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

function guid() {
  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}

function lock() {
  return mutex.promise().then(mutex => mutex.lock());
}

function unlock(passThrough) {
  return new Promise((resolve, reject) => {
    mutex.unlock();
    resolve(passThrough);
  });
}

var app = angular.module('myApp', []);
var mutex = new MutexPromise(guid());
// var socket = io();

app.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});

app.controller('posts', ($scope, $http, $timeout) => {
  $scope.postModel = new PostModel();

  (function tick() {
    lock().then(() => Promise.all([
      $http.get("http://localhost:3000/posts")
      .then(response => {
        $scope.postModel.addOnlinePosts(response.data);
      }),
      $http.get("http://localhost:3000/drafts")
      .then(response => {
        $scope.postModel.addOnlineDrafts(response.data);
      }),
      $http.get("http://localhost:3000/offlineposts")
      .then(response => {
        $scope.postModel.addOfflinePosts(response.data);
      }),
      $http.get("http://localhost:3000/offlinedrafts")
      .then(response => {
        $scope.postModel.addOfflineDrafts(response.data);
      }),
    ])).then(() => Promise.all(
      Object.keys($scope.postModel.drafts.offline).map(key => {
        var post = $scope.postModel.drafts.offline[key];
        return $scope.savePost(post, true).then(online => {
          if (online) delete $scope.postModel.drafts.offline[key];
        })
      }))).catch(() => {}).then(unlock);
    //- socket.emit('test channel', "ping");
    $timeout(tick, 500);
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

  $scope.savePost = (post, isSync) => {
    if (!('_tmpId' in post)) {
      post._tmpId = guid()
    }
    if (!isSync) {
      post.updated = new Date().toJSON();
    }
    return $http.put("/post", post).then(response => {
      var online = JSON.parse(response.headers('X-Online'));
      if ($scope.mode == 'new' && (!isSync || online)) {
        $scope.newPost()
      }
      return online;
    });
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
    $http.put("/post", post).then(response => {
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
    $http.delete(`/post/${post._id}`).then(response => {
      $scope.postModel.removeDraft(post, online)
      $scope.postModel.removePost(post, online)
    });
    $scope.newPost()
  }
});
