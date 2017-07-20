const {ipcRenderer} = require('electron');

const getColors = require('get-image-colors');
var tinygradient = require('tinygradient');

var Worker = require('workerjs');
var tagsWorker = new Worker("js/tags_worker.js");

const fs = require('fs');
const path = require('path');
const music_exts = ['.mp3', '.m4a', '.flac'];
window.cancelAnimationFrame = ( function() {
    return window.cancelAnimationFrame
})();

window.requestAnimationFrame = (function(){
    return  window.requestAnimationFrame
})();

function extension(element) {
  var extName = path.extname(element);
  return music_exts.indexOf(extName) !== -1; 
};

function is_image(element) {
  var extName = path.extname(element);
  return [".jpg", ".jpeg", ".png", ".bmp"].indexOf(extName) !== -1; 
};

var cModule = angular.module("app.controllers", []);
cModule.controller('AppCtrl', function ($scope, $sce, $timeout, $localForage, Song, File) {
    var vm = this;
    $scope.name = "App Name";
    $scope.hoverClass = "";
    $scope.songs = [];
    $scope.selectedSongs = [];
    $scope.playing = false;
    $scope.perCentIn = 0;
    $scope.curPlaylist = {name: 'Unnamed playlist', curSong: -1, songs: []};
    var over = false;
    var animFrame;
    var player = new Audio();
    var context = new AudioContext();
    var analyser = context.createAnalyser();
    var randomList = [];

    $scope.curSong = -1;
    $scope.player = player;
    $scope.listOpen = true;
    $scope.shuffle = false;
    $scope.repeat = false;

    $scope.showLyrics = false;
    $scope.curSongLyrics = "";
    $scope.showTabs = false;
    $scope.curSongTabs = "";

    ipcRenderer.on('global-shortcut', (event, arg) => {
        switch (arg) {
            case 0:
                $scope.playPause();
                break;
            case 1:
                $scope.nextSong();
                break;    
            case 2:
                $scope.prevSong();
                break;
            case 3:
                player.currentTime+=6;
                break;    
            case 4:
                player.currentTime-=6;
                break;
            case 5:
                player.currentTime+=13;
                break;    
            case 6:
                player.currentTime-=13;
                break;
            case 7:
                $scope.toggleRepeat();
                break;
            case 8:
                $scope.toggleShuffle();
                break;            
            case 9:{
                var small_pics = [];
                var big_pics = [];

                File.picDirectory()
                .then(function(fols){
                   fols.map(function(fol){
                        fs.readdir(fol, (err, files) => {
                            var images = files.filter(is_image);
                            // console.log(images);
                            images.forEach(file_inner => {
                                var name = file_inner.toLowerCase();

                                if(
                                    name.indexOf("album") != -1 
                                    || name.indexOf("art") != -1
                                    || name.indexOf("cover") != -1
                                    || name.indexOf("cov") != -1
                                    || name.indexOf("front") != -1){
                                    var type = path.extname(file_inner);
                                    var type_short = type.substring(type.lastIndexOf(".") + 1, type.length);
                                    console.log(type_short);
                                    if(name.indexOf("small") != -1)
                                        small_pics.push({path: fol + "/" + file_inner, type: type_short});
                                    else
                                        big_pics.push({path: fol + "/" + file_inner, type: type_short});
                                }
                            });

                            console.log(small_pics);
                            console.log(big_pics);

                            if(small_pics.length)
                                var small_pic = small_pics[0];

                            if(big_pics.length){
                                var big_pic = big_pics[0];
                                if(!small_pics.length)
                                    var small_pic = big_pics[0];
                            }
                            
                            $scope.processFiles(files, true, fol, {small: small_pic, large: big_pic});
                        });
                    }); 
                })
                .catch(function(err){
                    console.log(err);
                });
            }
            break;
            case 10:{
                player.volume -=0.1;
            }
            break;
            case 11:{
                player.volume +=0.1;
            }
            break;
            case 12:{
                player.volume.muted = player.volume.muted;
            }
            break;
            case 13:{
                $scope.showLyrics = !$scope.showLyrics;
            }
            break;
            case 14:{
                $scope.showTabs = !$scope.showTabs;
            }
            break;
            case 15:{
                $scope.removeSelectedSongs();
            }
            break;
            case 16:{
                $scope.selectNextSong();
            }
            break;
            case 17:{
                $scope.selectPrevSong();
            }
            break;
            default:
                // statements_def
                break;
        }
    });

    tagsWorker.addEventListener('message', function(e){
        var song = e.data.song;
        var err = e.data.err;
        if(song)
            $scope.pushSong(song);

        if(err){
            console.log("Error!");
            console.log(err);
            console.log("***Error mwisho***\n");
        }
    });

    $scope.$watch("showLyrics", function() {
        console.log('showLyricsChanged: ' + $scope.showLyrics);
        if($scope.showLyrics && !$scope.showTabs && $scope.curSong != -1)
            $scope.getLyrics($scope.songs[$scope.curSong]);
    });

    $scope.$watch("showTabs", function() {
        console.log('showTabsChanged: ' + $scope.showTabs);
        if($scope.curSong == -1)
            return;

        if($scope.showTabs)
            $scope.getLyrics($scope.songs[$scope.curSong]);
        else if(!$scope.showTabs && $scope.showLyrics)
            $scope.getTabs($scope.songs[$scope.curSong]);
    });


    $scope.getTabs = function(song){
        $scope.curSongTabs = $sce.trustAsHtml("");

        if(song.artist && song.title){
            $scope.curSongTabs = $sce.trustAsHtml("fetching tabs for " + song.title + "...");
            Song.getTabs(song.title, song.artist)
            .then(function(tabs){
                $scope.curSongTabs = $sce.trustAsHtml(tabs);
                // console.log(tabs)
            })
            .catch(function(err){
                $scope.curSongTabs = $sce.trustAsHtml(err);
                console.log(err);
            });
        }else{
            $scope.curSongTabs = $sce.trustAsHtml("No tabs for this song.");
        }
    }

    $scope.getLyrics = function(song){
        $scope.curSongLyrics = $sce.trustAsHtml("");

        if(song.artist && song.title){
            $scope.curSongLyrics = $sce.trustAsHtml("fetching lyrics for " + song.title + "...");
            Song.getLyrics(song.title, song.artist)
            .then(function(lyrics){
                $scope.curSongLyrics = $sce.trustAsHtml(lyrics);
            })
            .catch(function(err){
                $scope.curSongLyrics = $sce.trustAsHtml(err);
                console.log(err);
            });
        }else{
            $scope.curSongTabs = $sce.trustAsHtml("No lyrics for this song.");
        }
    }

    $scope.processFiles = function(files, choice, parent, covers){
        if(choice && parent){
            var albumArt = false;

            if(covers.large)
                albumArt = covers;
            else if(covers.small){
                albumArt = {};
                albumArt.large = {path : covers.small.path, type: covers.small.type};
            }
            
            console.log(albumArt);

            // var worker = new Worker("js/tags_worker.js");
            var worker = tagsWorker;
            worker.addEventListener('message', function(e){
                var song = e.data.song;
                var err = e.data.err;
                if(song){
                    $scope.pushSong(song);
                    if(song.artwork)
                        albumArt.large = {
                            path: song.artwork,
                            type: song.imageMime
                        }
                }

                if(err){
                    console.log("Error!");
                    console.log(err);
                    console.log("***Error mwisho***\n");
                }
            });

            files.filter(extension).forEach(file_inner => {
                // console.log(parent, file_inner);
                var fl = {
                    name: file_inner,
                    path: parent + '/' + file_inner
                };
                worker.postMessage({file: fl, albumArt : albumArt});
            });
        }else{
            files.map(function(file) {
                var fl = {
                    name: file.name,
                    path: file.path
                };

                tagsWorker.postMessage({file: fl});
            });
        }
    }

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
        randomList.push($scope.songs.length);
        randomList = shuffle(randomList);

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

    $scope.toggleShuffle = function(){
        $scope.shuffle = !$scope.shuffle;
    }

    $scope.toggleRepeat = function(){
        $scope.repeat = !$scope.repeat;
        player.loop = $scope.repeat;
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
        if($scope.repeat){
            player.currentTime = 0;
            return;
        }

        var prev = $scope.curSong > 0 ? $scope.curSong - 1 : $scope.songs.length - 1;
        $scope.playSong(prev);
    }

    $scope.nextSong = function(){
        if($scope.repeat){
            player.currentTime = 0;
            return;
        }

        var next = $scope.curSong < $scope.songs.length - 1 ? $scope.curSong + 1 : 0;
        $scope.playSong(next);
    }

    $scope.playSong = function($index){
        if($scope.shuffle)
            $index = randomList[$index];

        $scope.curSong = $index;
        var song = $scope.songs[$index];
        $scope.playPause(song.path);

        if(song.artwork)
            setPlayerColors(song.artwork, song.imageMime);
        else
            setPlayerColors();
    }

    $scope.songClick = function($index){
        if($scope.selectedSongs.length < 1){
            $scope.playSong($index);
        }else{
            if(!$scope.songSelected($index))
                $scope.selectSong($index);
            else
                $scope.unSelectSong($index);
        }
    }

    $scope.songPress = function($index){
        $scope.selectSong($index);
    }

    $scope.selectSong = function($index){
        if(!$scope.songSelected($index)){
            $scope.selectedSongs.push($index);
        }
    }

    $scope.unSelectSong = function($index){
        $scope.selectedSongs.splice($scope.selectedSongs.indexOf($index), 1);
    }

    $scope.getLastSelectedSong = function(){
        var selectedSongs = $scope.selectedSongs;
        return selectedSongs[selectedSongs.length - 1];
    }

    $scope.getFirstSelectedSong = function(){
        return $scope.selectedSongs[0];
    }

    $scope.selectNextSong = function(){
        var last_selected = $scope.getLastSelectedSong();
        var first_selected = $scope.getFirstSelectedSong()

        if(last_selected < first_selected)
            $scope.songClick(last_selected);
        else if(last_selected >= first_selected)
            if(last_selected < $scope.songs.length - 1)
                $scope.selectSong(last_selected + 1);
    }

    $scope.selectPrevSong = function(){
        var last_selected = parseInt($scope.getLastSelectedSong());
        var first_selected = $scope.getFirstSelectedSong()
        
        if(last_selected > first_selected)
            $scope.songClick(last_selected);
        else if(last_selected <= first_selected)
            if(last_selected > 0)
                $scope.songClick(last_selected - 1);
    }

    $scope.removeSong = function($index){
        $scope.songs.splice($index, 1);
    }

    $scope.songSelected = function($index){
        return $scope.selectedSongs.indexOf($index) != -1;
    }


    $scope.songReleased = function($index){
        // console.log("Released!");
    }    

    $scope.removeSelectedSongs = function(){
        for (var i = $scope.selectedSongs.length - 1; i >= 0; i--) {
            $idx = $scope.selectedSongs[i];
            $scope.unSelectSong($idx);

            if($scope.curSong != $idx){
                $scope.removeSong($idx);
            }
        }
    }

    $scope.playPause = function(path){
        if(path){
            if(path === $scope.curSong.path)
                return;

            player.src = path;
            player.play();
            $scope.playing = true;

            if($scope.showLyrics && $scope.showTabs)
                $scope.getTabs($scope.songs[$scope.curSong]);
            else if($scope.showLyrics && !$scope.showTabs)
                $scope.getLyrics($scope.songs[$scope.curSong]);
        }else if(!path && $scope.curSong != -1){
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

    function setPlayerColors(buffer, mime){
        // var mime_str = 'image/jpg';
        if(buffer){
            var mime_str = 'image/' + mime;
            
            getColors(buffer, mime_str).then(colors => {
                $scope.progressBg = colors[0].alpha(0.3).css();
                $scope.barBg = colors[0].css();
                $scope.shStyle = "box-shadow: 0 0 15px " + $scope.progressBg;
                var gradient = tinygradient(colors.map(color => color.hex()));
                var gradientStr = gradient.css();
                $scope.grStyle = "background-image:" + gradientStr;
            });
        }else{
            $scope.progressBg = "rgba(0,0,0,0.3)";
            $scope.barBg = "#333";
            $scope.shStyle = "box-shadow: 0 0 15px " + $scope.progressBg;
            var gradient = tinygradient("#333", "#555", "#333");
            var gradientStr = gradient.css();
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
            if($scope.repeat)
                return;

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


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']});
