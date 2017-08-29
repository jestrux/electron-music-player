var Worker = require('workerjs');
var colorWorker = new Worker("js/color_worker.js", true);
const getColors = require('get-image-colors');

var cModule = angular.module("app.controllers", []);
var tinygradient = require('tinygradient');

window.cancelAnimationFrame = ( function() {
    return window.cancelAnimationFrame          ||
        window.webkitcancelAnimationFrame    ||
        window.mozcancelAnimationFrame       ||
        window.ocancelAnimationFrame     ||
        window.mscancelAnimationFrame        ||
        clearTimeout
})();

window.requestAnimationFrame = (function(){
    return  window.requestAnimationFrame       || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame    || 
    window.oRequestAnimationFrame      || 
    window.msRequestAnimationFrame     || 
    function(/* function */ callback, /* DOMElement */ element){
        return window.setTimeout(callback, 1000 / 60);
    };
})();

cModule.controller('AppCtrl', function ($scope, $timeout) {
    var vm = this;
    $scope.name = "App Name";
    $scope.hoverClass = "";
    $scope.songs = [];
    $scope.playing = false;
    $scope.perCentIn = 0;
    $scope.curPlaylist = {name: 'Unnamed playlist', curSong: -1, songs: []};
    var over = false;
    var animFrame;
    var player = new Audio();
    var context = new AudioContext();
    var analyser = context.createAnalyser();
    $scope.curSong = -1;
    $scope.player = player;
    $scope.listOpen = true;

    $scope.nowHovering = function(e){
        // console.log(e)
    }

    $scope.clearSongs = function(){
        $scope.songs = [];
        $scope.curSong = -1;

        $timeout(function(){
            $scope.$apply();
        }, 10);
    }

    $scope.pushSong = function(song){
        $scope.songs.push(song);
        if($scope.curSong === -1){
            $scope.curSong = 0;

            $scope.playPause(song.path);
            if(song.artwork)
                setPlayerColors(song.artwork, song.imageMime);
            else
                setPlayerColors();
        }
    }

    $scope.setCurSong = function($index){
        $scope.curSong = $index;
    }

    $scope.canHasPrev = function(){
        if($scope.songs.length < 2)
            return false;
        
        return $scope.curSong !== 0;
    }

    $scope.canHasNext = function(){
        if($scope.songs.length < 2)
            return false;
        
        return $scope.curSong !== $scope.songs.length - 1;
    }

    $scope.seekTo = function(e){
        if(!$scope.curSong !== -1){
            player.currentTime = (e.clientX / window.innerWidth) * player.duration;
        }
    }

    $scope.prevSong = function(){
        $scope.playSong($scope.curSong - 1);
    }

    $scope.nextSong = function(){
        $scope.playSong($scope.curSong + 1);
    }

    $scope.playSong = function($index){
        $scope.curSong = $index;
        var song = $scope.songs[$index];
        $scope.playPause($scope.songs[$index].path);

        if(song.artwork)
            setPlayerColors(song.artwork, song.imageMime);
        else
            setPlayerColors();
    }

    $scope.playPause = function(path){
        if(path){
            if(path === $scope.curSong.path)
                return;

            player.src = path;
            player.play();
            $scope.playing = true;
        }else{
            if($scope.playing)
                player.pause();
            else
                player.play();

            $scope.playing = !$scope.playing;
        }

        if($scope.playing){
            if($scope.curSong === -1)
                rollIt();
            else
                frameLooper();
        }else{
            cancelAnimationFrame(animFrame);
        }
    }

    $scope.formattedTime = function(time){
        if (!time)
            time = 0;

        var hr  = parseInt(time/3600);
        var min = parseInt(time/60);
        var sec = parseInt(time%60);

        return ((hr > 0) ? ((hr > 9) ? hr : '0'+hr)+':' : '' )+((min > 9) ? min : '0'+min)+':'+ ((sec > 9) ? sec : '0'+sec);
    }

    colorWorker.addEventListener('message', function(e){
        console.log('worker amejibu!!');
        console.log(e.data);
        // var colors = e.data.colors;
        // $scope.progressBg = colors[0].alpha(0.3).css();
        // $scope.barBg = colors[0].css();
        // $scope.shStyle = "box-shadow: 0 0 15px " + $scope.progressBg;
        // var gradient = tinygradient(colors.map(color => color.hex()));
        // var gradientStr = gradient.css();
        // $scope.grStyle = "background-image:" + gradientStr;
    });

    function setPlayerColors(img, mime){
        if(img){
            var mime_str = 'image/' + mime;
            console.log('tumemcheki worker');
            colorWorker.postMessage({image: img, mime : mime});
        }else{
            $scope.progressBg = "rgba(0,0,0,0.3)";
            $scope.barBg = "#333";
            $scope.shStyle = "box-shadow: 0 0 15px " + $scope.progressBg;
            var gradientStr = "";
            $scope.grStyle = "background-image:" + gradientStr;
        }
    }

    function rollIt(){
        source = context.createMediaElementSource(player); 
        source.connect(analyser);
        analyser.connect(context.destination);

        frameLooper();
    }

    function frameLooper(){
        animFrame = requestAnimationFrame(frameLooper);
        
        if(over){
            player.currentTime = 0;
            $scope.playPause();
        }

        $scope.perCentIn = player.currentTime / player.duration * 100;
        
        $timeout(function() {
            $scope.$apply();
        }, 500);

        if(player.ended && !over){
            if($scope.canHasNext())
                $scope.nextSong();
            else
                $scope.playSong(0);
                // over = true;
        }
    }
});

cModule.controller('ListItemsCtrl', function ($scope) {
    var vm = this;
    $scope.name = "List Controller";
});