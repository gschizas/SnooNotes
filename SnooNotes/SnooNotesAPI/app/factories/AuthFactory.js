﻿angular.module('SnooNotes')
    .factory('AuthFactory', function AuthFactory($q, $http, $location, localStorageService, $cookies) {
        'use strict';
        var exports = {};

        exports.isLoggedIn = function () {
            var deferred = $q.defer();
            $http.get('api/Account/IsLoggedIn')
                .then(
                    function () {
                        //return true;
                        deferred.resolve(true);
                    },
                    function () {
                        //return false;
                        deferred.resolve(false);
                    });
            return deferred.promise;
        };

        exports.getCurrentUser = function () {
            var deferred = $q.defer();
            if (exports.currentUser.isAuth) {
                deferred.resolve(exports.currentUser);
            }
            else {
                var curUser = localStorageService.get('currentUser');
                if (curUser && curUser.isAuth) {
                    exports.currentUser = curUser;
                    deferred.resolve(exports.currentUser);
                }
                else {
                    $http.get('api/Account/GetCurrentUser')
                        .then(
                            function (u) {
                                localStorageService.set('currentUser', { isAuth: true, userName: u.data });
                                exports.currentUser.userName = u.data;
                                exports.currentUser.isAuth = true;
                                deferred.resolve(exports.currentUser);
                            },
                            function () {
                                exports.logout();
                                deferred.reject('Not logged in');
                            });
                }
            }
            return deferred.promise;
        }
        exports.logout = function () {
            $http.post('Auth/Logout').then(
            function(){
                localStorageService.remove('currentUser');
                exports.currentUser.userName = "";
                exports.currentUser.isAuth = false;
            },
            function () {
                //todo catch dat error
            })
            
           
            //$cookies.remove('bog');
        }
        exports.currentUser = {isAuth:false,userName:""};
        return exports;
    });