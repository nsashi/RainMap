angular.module('report.controllers', [])

.controller('ReportCtrl', function($scope, Chats, $ionicPopup, $http, apiUrl) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.form = {};
  $scope.form.date =  new Date();

  // Validate and submit form
  $scope.sendReport = function(form){
	// TODO: Validate fields
  if (($scope.form.postcode == null) || ($scope.form.postcode == null) || ($scope.form.postcode== null) || ($scope.form.postcode == null))
  {
    console.log("Fill out the form!");
    var alertPopup = $ionicPopup.alert({
      title: 'Error',
      template: "Please fill out all the fields"
    });
  }
  else
  {
    //Send POST Request
    var url = apiUrl + '/api/report'
    $http.post(url, {
      postcode:form['postcode'],
      date:form['date'],
      wellID:form['well_id'],
      depth:form['wt_depth']
    })
    .then(function(response) {
     // Perform on request confirmation:
     var alertPopup = $ionicPopup.alert({
      title: 'Submitted',
      template: 'Thanks!'
    });
   }, function(response) {
    //Error
    var alertPopup = $ionicPopup.alert({
      title: 'Error',
      template: response.data.message
    });
  });
  }
}})