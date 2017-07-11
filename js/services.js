var sModule =  angular.module('app.services', []);
const scrapeIt = require("scrape-it");
const {dialog} = require('electron').remote;
const globParent = require('glob-parent');
const mainPath = require('path');
const url = require('url');

sModule.factory('File', function($http, $q, $localForage) {
    return {
        picDirectory: function() {
            var def = $q.defer();

            $localForage.getItem('lastPath').then(function(path) {
                var fols = dialog.showOpenDialog({
                    // filters: [{name: 'Music', extensions: music_exts}],
                    defaultPath: path,
                    properties: ['openDirectory', 'multiSelections']
                });

                if(fols){
                    var imParent = globParent(fols[0]);
                    var lastPath = fols[0].substr(0, fols[0].lastIndexOf(imParent) + imParent.length + 1);
                    $localForage.setItem('lastPath', lastPath);
                    
                    def.resolve(fols);
                }else{
                    def.reject("Nothing chosen!");
                }

            });

            return def.promise;
        },

        checkLocalVersion: function(path){
            var res = {exists: false, contents: ""};
            var def = $q.defer();
            var path = mainPath.join(__dirname, path + ".txt");

            console.log(path);
            // if(fs.existsSync(path)){
                fs.readFile(path, function (err, data) {
                    if (err) {
                        def.reject("Read failed!");
                    }else{
                        res.exists = true;
                        res.contents = data.toString();
                        def.resolve(res);
                    }
                });
            // }else{
                // res.exists = false;
                // def.resolve(res);
            // }

            return def.promise;
        },

        exists: function(path){
            return fs.existsSync(path);
        },

        read: function(path){
            var def = $q.defer();
            fs.readFile(mainPath.join(__dirname, path + ".txt"), function (err, data) {
              if (err) {
                 def.reject("Read failed!");
              }
              def.resolve(data.toString());
            });

            return def.promise;
        },

        save: function(path, contents){
            var def = $q.defer();
            fs.writeFile(mainPath.join(__dirname, path + ".txt"), contents,  function(err) {
               if (err) {
                 def.reject("Save failed!");
              }
              def.resolve("File saved");
            });

            return def.promise;
        }
    }
});


sModule.factory('Song', function($http, $q, File) {
    return {
        getLyrics: function(title, artist){
            var def = $q.defer();
            const BASE_URL = "https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?format=json&";
            const API_KEY = "49f50d0df0d4767e9fee573c6840673a";

            var artist = artist.toLowerCase().replace(/\s/g, "");
            var song = title.toLowerCase().replace(/\s/g, "");
            var song_path = "http://www.azlyrics.com/lyrics/"+artist+"/"+song+".html";
            var local_path = "/lyrics/"+artist+"-"+song;

            File.checkLocalVersion(local_path)
            .then(function(local_version){
                if(local_version.exists){
                    if(local_version.contents == "null")
                        def.reject("No lyrics for this song.");
                    else{
                        var tabs = local_version.contents.replace(/\n/g, "<br />");
                        def.resolve(tabs);
                        console.log('Lipo, wait for it.....!');
                        return;
                    }
                }
            })
            .catch(function(local_version){
                console.log('Haipo fetching online!');

                scrapeIt(song_path, {lyrics: ".ringtone ~ div:not(.noprint):not(.footer-wrap):not(.smt)"})
                .then(page => {
                    var lyrics = page.lyrics.replace(/\n/g, "<br />");

                    if(page.lyrics && page.lyrics.length){
                        def.resolve(lyrics);
                        File.save(local_path, page.lyrics)
                        .then(function(){
                            console.log('Lyrics saved');
                        },function(){
                            console.log('Lyrics not saved');
                        });
                    }else{
                        $http({
                            method: "GET",
                            url: BASE_URL+"q_track="+title+"&q_artist="+artist+"&apikey="+API_KEY
                        }).then(function(response) {
                            var res_lyrics = response.data.message.body.lyrics;
                            if(res_lyrics && res_lyrics.length){
                                var lyrics_un = response.data.message.body.lyrics.lyrics_body;
                                var lyrics_wm = lyrics_un.replace("******* This Lyrics is NOT for Commercial use *******","");
                                var lyrics_f = lyrics_wm.replace(/\n/g, "<br />");
                                var lyrics = lyrics_f.substring(0, lyrics_f.lastIndexOf("..."));
                                def.resolve(lyrics);
                                console.log('Zipo musixmatchatch');
                            }
                            else{
                                lyrics = null;
                                console.log('Hazipo hata musixmatchatch');
                                def.reject("Lyrics for " + title + " not available");
                            }

                            File.save(local_path, lyrics)
                            .then(function(){
                                console.log('Lyrics saved');
                            },function(){
                                console.log('Lyrics not saved');
                            });
                        })
                        .catch(function(){
                            console.log('Hazipo hata musixmatchatch nimecatch');
                            def.reject("Failed to load lyrics");
                        });
                    }
                })
                .catch(err => {
                    $http({
                        method: "GET",
                        url: BASE_URL+"q_track="+title+"&q_artist="+artist+"&apikey="+API_KEY
                    }).then(function(response) {
                        if(response.data.message.body.lyrics){
                            var lyrics = response.data.message.body.lyrics;
                            var uplyrics = lyrics.lyrics_body;
                            var lyrics_wm = uplyrics.replace("******* This Lyrics is NOT for Commercial use *******","");
                            var lyrics = lyrics_wm.replace(/\n/g, "<br />");
                            def.resolve(lyrics);
                        }
                        else{
                            lyrics = null;
                            def.reject("Lyrics for " + title + " not available");
                        }

                        File.save(local_path, lyrics)
                        .then(function(){
                            console.log('Lyrics saved');
                        },function(){
                            console.log('Lyrics not saved');
                        });
                    },function(error){
                        def.reject("Failed to load lyrics");
                    });
                });
            });

            return def.promise;
        },

        getTabs: function(title, artist, v){
            var def = $q.defer();
            var artist = artist.toLowerCase().replace(/\s/g, "_");
            var song = title.toLowerCase().replace(/\s/g, "_");
            var version = !v || v == 1 ? "" : "_ver" + v;
            var song_path = "/"+artist+"/"+song+version;
            var url_path = "https://tabs.ultimate-guitar.com/"+artist[0]+song_path+"_crd.htm";
            var local_path = "/tabs/"+artist+"-"+song+version;

            File.checkLocalVersion(local_path)
            .then(function(local_version){
                if(local_version.exists){
                    if(local_version.contents == "null")
                        def.reject("No tabs for this song.");
                    else{
                        var tabs = local_version.contents.replace(/\n/g, "<br />");
                        def.resolve(tabs);
                        console.log('Lipo, wait for it.....!');
                        return;
                    }
                }
            })
            .catch(function(local_version){
                console.log('Haipo fetching online!');

                scrapeIt(url_path, {
                    version: ".t_version",
                    ratingCount: ".raiting .v_c",
                    ratingType: ".vote-success",
                    other_versions : {
                        listItem : ".versions_column li:not(.curversion)",
                        data : {
                            v : {
                                selector: "a",
                                convert: x => x.replace("ver ", "")
                            }
                        }
                    },
                    tabs: {
                        selector: ".js-tab-content",
                        how: "html",
                        trim: false
                    }
                }).then(page => {
                    if(page.tabs){
                        var tabs = page.tabs.replace(/\n/g, "<br />");
                        def.resolve(tabs);
                    }else{
                        def.reject("No tabs for this song.");
                    }

                    File.save(local_path, page.tabs)
                    .then(function(){
                        console.log('Tabs saved');
                    },function(){
                        console.log('tabs not saved');
                    });
                })
                .catch(err => {
                    def.reject("Error imetokea.");
                });
            });

            return def.promise;
        },

        getArtWork: function(title, artist){
            var def = $q.defer();

            $http({
                method: "GET",
                url: BASE_URL+"q_track="+title+"&q_artist="+artist+"&apikey="+API_KEY
            }).then(function(response) {
                if(response.data.message.body.lyrics)
                    def.resolve(response.data.message.body.lyrics.lyrics_body);
                else
                    def.reject("Lyrics not available for " + title + " by " + artist);
            },function(error){
                def.reject("Failed to load lyrics");
            });

            return def.promise;
        }
    }
});