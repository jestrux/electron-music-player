var cModule = angular.module("app.config", []);

app.config(function($stateProvider, $urlRouterProvider, $compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\//);

    $stateProvider

    .state('app', {
        url: '/app',
        abstract: true,
        template: '<app-outer></app-outer>',
    })

    // .state('app.item', {
    //     url: '/item/:id',
    //     views: {
    //         'appBackLink': {
    //             template: '<a href="#!/app/list/" style="margin-right: 24px; color: inherit; text-decoration: none"><svg fill="#ffffff" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>',
    //         },
    //         'appTitle': {
    //             template: '<h2 class="section-title">{{$resolve.item.title}}</h2>',
    //         },
    //         'appContent': {
    //             template : '<p style="padding: 22px 36px">{{$resolve.item.subtitle}}</p>'
    //         }
    //     },
    //     resolve: {
    //         item: function(List, $stateParams){
    //             // return List.get($stateParams.id - 1);
    //             return {};
    //         }
    //     }
    // });

    $urlRouterProvider.otherwise('/app/list');
});