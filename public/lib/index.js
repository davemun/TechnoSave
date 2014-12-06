var app = angular.module('App', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'partial-items.html'
    });

    $urlRouterProvider.otherwise('/');
});


app.controller('ItemListCtrl', ['$scope', '$http', function ($scope, $http) {
  
  console.log('ItemListCtrl was loaded!');


  $scope.addItem = function() {
    $http.post('/*', $scope.itemsModel)
      .success(function(data){
        console.log('data from server', data);
      })
  };
}]);