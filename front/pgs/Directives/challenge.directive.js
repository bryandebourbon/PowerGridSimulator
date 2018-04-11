app.directive('challengeDirective', function () {
    return {
        restrict: 'EA',
        templateUrl: './Partials/_Challenge.html',
        scope: {
            challenge: '=?'
        },
        controller: ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
            /*  
            **	use: hit submit button
            **	behavior: bring user back to evaluation view with submission results
            **	input: none
            **	output: none
            */
            $scope.submitChallenge = function () {
                Spinner.show();

                /* send in challenge simulation data and receive evaluation for current submission */
                $DataService.submitChallenge({ challenge: $scope.challenge, teamname: $.cookie('teamname'), challengeID: 10 })
                    .then(function (data) {
                        Spinner.hide();

                        if (data.success) {
                            $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'evaluation', evaluation: data.eval }); });
                        } else {
                            Warning.show(data.message);
                        }
                    }).catch(function (error) {
                        console.log(error);
                    })
            }

            /*  
            **	use: hit lead board button
            **	behavior: bring user back to leaderboard view
            **	input: none
            **	output: none
            */
            $scope.viewLeaderBoard = function () {
                Spinner.show();

                /* retrieve leaderboard information and bring to leaderboard view */
                $DataService.getLeaderBoard({ teamname: $.cookie('teamname'), challengeID: $scope.challenge.id })
                    .then(function (data) {
                        Spinner.hide();

                        $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'leaderboard', challenge: $scope.challenge, leaderboard: data, teamname: $.cookie('teamname') || '' }); });
                    }).catch(function (error) {
                        console.log(error);
                    })
            }

            /*  
            **	use: hit go back button
            **	behavior: bring user back to challenges view
            **	input: none
            **	output: none
            */
            $scope.goBack = function () {
                Spinner.show();

                /* reloading challenges listing in case there are changes to chanllenge entries triggered from elsewhere */
                $DataService.getChallenges({ teamname: $.cookie('teamname') })
                    .then(function (data) {
                        Spinner.hide();

                        $rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: data });
                    }).catch(function (error) {
                        console.log(error);
                    })
            }
            /*  
            **	use: hit log out button
            **	behavior: bring user back to log in view
            **	input: none
            **	output: none
            */
            $scope.logOut = function () {
                $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
            }
        }]
    }
})