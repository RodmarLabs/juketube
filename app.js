var app = angular.module('JukeTubeApp', []);

// Run

app.run(function () {
  var tag = document.createElement('script');
  tag.src = "http://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

// Config

app.config( function ($httpProvider) {
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

// Service

app.service('VideosService', ['$window', '$rootScope', '$log', '$http', function ($window, $rootScope, $log, $http) {

  var service = this;

  var youtube = {
    ready: false,
    player: null,
    playerId: null,
    videoId: null,
    videoTitle: null,
    playerHeight: '480',
    playerWidth: '640',
    state: 'stopped'
  };
  var results = [];
  var upcoming = [];
  var history = [
    //{ id: 'j_DAazxoodM', 'title': 'Penny Lane - The Beatles - lyrics' }
  ];

  $window.onYouTubeIframeAPIReady = function () {
    $log.info('Youtube API is ready');
    youtube.ready = true;
    service.bindPlayer('placeholder');
    service.loadPlayer();
    $rootScope.$apply();
  };

  function onYoutubeReady (event) {
    $log.info('YouTube Player is ready');

      if(typeof history[0] !== 'undefined'){
          youtube.player.cueVideoById(history[0].id);
          youtube.videoId = history[0].id;
          youtube.videoTitle = history[0].title;
      }
  }

  function onYoutubeStateChange (event) {
    if (event.data == YT.PlayerState.PLAYING) {
      youtube.state = 'playing';
    } else if (event.data == YT.PlayerState.PAUSED) {
      youtube.state = 'paused';
    } else if (event.data == YT.PlayerState.ENDED) {
      youtube.state = 'ended';

        $http.get('juketube.php', {
            params: {
                action: "getUpcoming"
            }
        }).success(function(data){

            if(typeof data[0] !== 'undefined'){
                upcoming = data;
                service.launchPlayer(data[0].id, data[0].title);
                service.archiveVideo(data[0].id, data[0].title);

                $http.get('juketube.php', {
                    params: {
                        action: "deleteVideo",
                        id: data[0].id
                    }
                }).success(function(data){
                    $log.info(data);
                }).error(function(){
                    $log.info('Error!');
                });

            }

        }).error(function(){
            return upcoming;
        });



    }
    $rootScope.$apply();
  }

  this.bindPlayer = function (elementId) {
    $log.info('Binding to ' + elementId);
    youtube.playerId = elementId;
  };

  this.createPlayer = function () {
    $log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
    return new YT.Player(youtube.playerId, {
      height: youtube.playerHeight,
      width: youtube.playerWidth,
      playerVars: {
        rel: 0,
        showinfo: 0
      },
      events: {
        'onReady': onYoutubeReady,
        'onStateChange': onYoutubeStateChange
      }
    });
  };

  this.loadPlayer = function () {
    if (youtube.ready && youtube.playerId) {
      if (youtube.player) {
        youtube.player.destroy();
      }
      youtube.player = service.createPlayer();
    }
  };

  this.launchPlayer = function (id, title) {
    youtube.player.loadVideoById(id);
    youtube.videoId = id;
    youtube.videoTitle = title;
    return youtube;
  }

  this.listResults = function (data) {
    results.length = 0;
    for (var i = data.items.length - 1; i >= 0; i--) {
      results.push({
        id: data.items[i].id.videoId,
        title: data.items[i].snippet.title,
        description: data.items[i].snippet.description,
        thumbnail: data.items[i].snippet.thumbnails.default.url,
        author: data.items[i].snippet.channelTitle
      });
    }
    return results;
  }

  this.queueVideo = function (id, title) {
      upcoming.push({
          id: id,
          title: title
      });

      $http.get('juketube.php', {
          params: {
              action: "queueVideo",
              id: id,
              title: title
          }
      }).success(function(data){
          $log.info(data);
      }).error(function(){
          $log.info('Error!');
      });

      return upcoming;
  };

  this.archiveVideo = function (id, title) {
    history.unshift({
      id: id,
      title: title
    });
    return history;
  };

  this.deleteVideo = function (list, id) {
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].id === id) {
        list.splice(i, 1);
        break;
      }
    }
  };

  this.getYoutube = function () {
    return youtube;
  };

  this.getResults = function () {
    return results;
  };

  this.getUpcoming = function () {
      return upcoming;
  };

  this.getHistory = function () {
    return history;
  };

}]);

// Controller

app.controller('VideosController', function ($scope, $http, $log, VideosService) {

    init();

    function init() {
        $http.get('juketube.php', {
            params: {
                action: "getUpcoming"
            }
        }).success(function(data){
            VideosService.upcoming = data;

            $scope.youtube = VideosService.getYoutube();
            $scope.results = VideosService.getResults();
            $scope.upcoming = VideosService.upcoming;
            $scope.history = VideosService.getHistory();
            $scope.playlist = true;

        }).error(function(){
            return upcoming;
        });
    }

    $scope.launch = function (id, title) {
      VideosService.launchPlayer(id, title);
      VideosService.archiveVideo(id, title);
      VideosService.deleteVideo(VideosService.upcoming, id);

        $http.get('juketube.php', {
            params: {
                action: "deleteVideo",
                id: id
            }
        }).success(function(data){
            $log.info(data);
        }).error(function(){
            $log.info('Error!');
        });

      $log.info('Launched id:' + id + ' and title:' + title);
    };

    $scope.queue = function (id, title) {
      VideosService.queueVideo(id, title);
      VideosService.deleteVideo($scope.history, id);
      $log.info('Queued id:' + id + ' and title:' + title);



        $http.get('juketube.php', {
            params: {
                action: "getUpcoming"
            }
        }).success(function(data){
            VideosService.upcoming = data;
            $scope.upcoming = VideosService.upcoming;
        }).error(function(){
            return upcoming;
        });
    };

    $scope.delete = function (list, id) {
        $http.get('juketube.php', {
            params: {
                action: "deleteVideo",
                id: id
            }
        }).success(function(data){
            $log.info(data);
        }).error(function(){
            $log.info('Error!');
        });

        VideosService.deleteVideo(list, id);
    };

    $scope.search = function () {
      $http.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: 'AIzaSyBILVbchuGXdecG83Nlgd2XnDovL8YUUvw',
          type: 'video',
          maxResults: '8',
          part: 'id,snippet',
          fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
          q: this.query
        }
      })
      .success( function (data) {
        VideosService.listResults(data);
        $log.info(data);
      })
      .error( function () {
        $log.info('Search error');
      });
    }

    $scope.tabulate = function (state) {
      $scope.playlist = state;
    }
});