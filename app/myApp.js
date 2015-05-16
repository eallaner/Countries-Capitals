// JavaScript Document
angular.module('myApp', ['ngAnimate', 'ngRoute'])
	.config(function($routeProvider){
         $routeProvider
         .when('/', {
            templateUrl: './home.html'
         })
         .when('/countries', {
            templateUrl : './countries.html',
            controller : 'countriesCtrl'
         })
         .when('/countries/:country', {
            templateUrl : './countryDetail.html',
            controller : 'countryDetailCtrl'
         })
         .when('/error',{
         	templateUrl : './error.html'
         })
         .otherwise('/error', {
		      templateUrl : './error.html'
		   });
	 })
    .factory('countryInfo', ['$location', '$http', function($location, $http){
        var countries = [];
        var countryResult={};
        var path = 'http://api.geonames.org/countryInfoJSON?username=eallaner';
        var i;
        $http.get(path, {cache:true})
               .success(function(data) {
                      for (i=0;i<data.geonames.length;i++){
                           countries[i] = data.geonames[i];
                      }
               })
               .error(function(data, status){
                     console.log('Error status: ' + status);
                     $location.path('/error');
               });

        function getCountry(countryNameWanted){
             for(i=0;i<countries.length;i++){
                 if(countries[i].countryName === countryNameWanted){
                       countryResult = countries[i];
                       break;
                 }
             }
             return countryResult;
        }
        
        function getCountries(){
             return countries;
        }

        return {
           getCountries: getCountries,
           getCountry:getCountry
        };
    }])
    .factory('capitalPopInfo',['countryInfo', 'countryNeighbor', '$http','$location', function(countryInfo, countryNeighbor, $http, $location){
         var popResult={};
      
         var getCapPopInfo = function(counCode, capName, countryName){     
              var resultTemp = countryInfo.getCountry(countryName);
              var neighbor = countryNeighbor.getNeighbor(countryName);

              var path = 'http://api.geonames.org/searchJSON?';
              var request = {
                       q: capName,
                       country: counCode,
                       fcode:'pplc',
                       username:'eallaner'              
              };
          
               $http({
                    method: 'GET',
                    url: path,
                    cache:true,
                    params: request
               })
               .success(function(data){
                          
                          if(capName){
                               popResult.counName = data.geonames[0].countryName;
                               popResult.capPop = data.geonames[0].population;  
                               popResult.cap = capName;  
                          }else{
                               popResult.counName = countryName;
                               popResult.capPop = 0;  
                               popResult.cap = 'N/A';  
                          }                                             
               })
               .error(function() {
                    console.log('Error status: ' + status);
                    $location.path('/error');
               });

               

               popResult.counPop = resultTemp.population;
               popResult.counArea = resultTemp.areaInSqKm;
               popResult.counNeighbor = neighbor;
               popResult.counCode = counCode;


               return popResult;
      
         }


         return {
           getCapPopInfo: getCapPopInfo
        };

    }])
    .factory('countryNeighbor', ['$http','countryInfo','$location', function($http, countryInfo, $location){
         var i;
         

         var getNeighbor = function(countryName){
                  var neighborResult=[];
                  var geoId = countryInfo.getCountry(countryName).geonameId;
                  
                  var path = 'http://api.geonames.org/neighboursJSON?';
                  var request = {
                                    geonameId: geoId,
                                    username:'eallaner'              
                                };

                  if (countryName =='Antarctica'){
                        neighborResult=[];
                  }else{
                     $http({
                             method: 'GET',
                             url: path,
                             cache:true,
                             params: request
                           })
                           .success(function(data) {
                                 if(data.geonames.length === 0){
                                       neighborResult = [];
                                 } else{
                                    for (i=0;i<data.geonames.length;i++){
                                       if(data.geonames.length >= 3){
                                          neighborResult[0] = data.geonames[0].countryName;
                                          neighborResult[1] = data.geonames[1].countryName;
                                          neighborResult[2] = data.geonames[2].countryName;
                                          break;
                                       } else{
                                          neighborResult[i] = data.geonames[i].countryName;
                                       }
                                    }  
                                 }                        
                                  
                           })
                           .error(function(data, status){
                                 console.log('Error status: ' + status);
                                 $location.path('/error');
                           });

                  }
                      
                  return neighborResult;
         }

         
        

         return {
             getNeighbor: getNeighbor
         };

    }])
    .run(function($rootScope, $location, $timeout) {
        $rootScope.$on('$routeChangeError', function() {
           $location.path('/error');
        });
        $rootScope.$on('$routeChangeStart', function(){
            if($location.path() === '/'){
               $rootScope.isLoading = false;
            } else{
               $rootScope.isLoading = true;
            }
        });
        $rootScope.$on('$routeChangeSuccess', function(){
            if($location.path() !== '/'){
               $timeout(function(){
                   $rootScope.isLoading = false;
               },2000);  
            }
        });
   })
   .controller('countriesCtrl', ['countryInfo', 'capitalPopInfo', '$scope', '$location', '$rootScope', '$timeout',
                                 function (countryInfo, capitalPopInfo, $scope, $location, $rootScope, $timeout) {         
               

               $scope.results = countryInfo.getCountries();
  
               $scope.gotoDetail = function (result){
                  $location.path('/countries/' +  result.countryName);                 
               }

   }])
	.controller('countryDetailCtrl',  ['$scope', 'countryInfo', 'capitalPopInfo', 'countryNeighbor', '$routeParams',
                                     function ($scope, countryInfo, capitalPopInfo, countryNeighbor, $routeParams) { 

               var countryCodeShow = countryInfo.getCountry($routeParams.country).countryCode;
               var capitalShow = countryInfo.getCountry($routeParams.country).capital || '';
               var countryNameShow = countryInfo.getCountry($routeParams.country).countryName;

               $scope.detailShow = capitalPopInfo.getCapPopInfo(countryCodeShow, capitalShow, countryNameShow);
               
              
               
}])