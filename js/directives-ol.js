"use strict";

var fs = require('fs');
var Worker = require('workerjs');
var tagsWorker = new Worker("js/tags_worker.js");

var dModule =  angular.module('app.directives', []);

dModule.component('appOuter',{
    bindings: {
        artist : '='
    },
    templateUrl: "templates/app-outer.html",
    controller: 'AppCtrl'
});

dModule.directive('dropTarget', function(){
    return{
        restrict : 'A',
        link: function(scope, $element){
            $element
            .bind('dragenter dragover', function(e){
                $element.addClass('hovered');
                e.preventDefault();
                e.stopPropagation();
            })
            .bind('dragleave dragexit', function(e){
                $element.removeClass('hovered');
                e.preventDefault();
                e.stopPropagation();
            })
            .bind('drop', function(e){
                $element.removeClass('hovered');
                e.stopPropagation();
                e.preventDefault();
                var start_time = new Date();
                start_time = start_time.getTime();
                var files = e.dataTransfer.files;

                tagsWorker.addEventListener('message', function(e){
                    var song = e.data.song;
                    var err = e.data.err;
                    var fin_time = new Date();

                    if(song){
                        // console.log("***Song***");
                        // console.log(song);
                        // console.log("***Song mwisho***\n");
                        // console.log(song);
                        scope.pushSong(song);
                    }

                    if(err){
                        console.log("Error!");
                        console.log(err);
                        console.log("***Error mwisho***\n");
                    }

                    // count ++;
                    // fin_time = fin_time.getTime();
                    // console.log("\n\n" + count + ". time el: " + (fin_time - start_time));
                });

                // processFiles(files, scope);
                var a_files = [].slice.call(files);
                a_files.map(function(file) {
                    var fl = {
                        name: file.name,
                        path: file.path
                    };

                    tagsWorker.postMessage({file: fl});
                });
            });
        }
    }
});


function processFiles(files, scope){
    var count = 0;
    var new_f = [];
    var a_files = [].slice.call(files);
    
    a_files.map(function(file) {
        var path = file.path;

        fs.lstat(path, (err, stats) => {
            if(err)
                return console.log(err); //Handle error

            var it_is = stats.isDirectory();

            if(it_is){
                console.log('ni dir!');
                fs.readdir(path, (err, files) => {
                    files.forEach(file_inner => {
                        var fl = {
                            name: file_inner,
                            path: path + file_inner
                        };
                        // console.log(fl);
                        tagsWorker.postMessage({file: fl});
                    });
                })
            }else{
                var fl = {
                    name: file.name,
                    path: file.path
                };
                // console.log(fl);
                tagsWorker.postMessage({file: fl});
            }
        });
    });
}