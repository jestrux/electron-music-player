"use strict";

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

                var a_files = [].slice.call(files);
                scope.processFiles(a_files);
            });
        }
    }
});