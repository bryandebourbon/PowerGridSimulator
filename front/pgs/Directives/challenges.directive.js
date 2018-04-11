app.directive('challengesDirective', function () {
    return {
        restrict: 'EA',
        templateUrl: './Partials/_Challenges.html',
        scope: {
            challenges: '=?'
        },
        controller: ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
            /*  
            **	use: hit preview button for challenge entries
            **	behavior: pop up modal showing challenge description
            **	input: none
            **	output: none
            */
            $scope.previewChallenge = function (id) {
                var challenge = _.find($scope.challenges, function (c) { return c.id == id; });

                if (challenge) {
                    var _previewModalTitle = $('.modal-title');
                    var _previewModalDescription = $('.modal-description');

                    _previewModalTitle.text(challenge.name);
                    _previewModalDescription.text(challenge.description);
                }
            }
            /*  
            **	use: hit simulate button for challenge entries
            **	behavior: bring user to challenge simulation view
            **	input: none
            **	output: none
            */
            $scope.simulateChallenge = function (id) {
                var challenge = _.find($scope.challenges, function (c) { return c.id == id; });

                if (challenge) {
                    /* retrieve single challenge definition and bring to challenge simulation view */
                    $DataService.getChallenge({ teamname: $.cookie('teamname'), challengeID: id })
                        .then(function (data) {
                            Spinner.hide();

                            $rootScope.$broadcast('pgsStateChanged', { state: 'grid', challenge: data });
                        }).catch(function (error) {
                            Spinner.hide();

                            Warning.show(error);
                        })
                }
            }

            /*  
            **	use: hit go back button
            **	behavior: bring user back to log in view
            **	input: none
            **	output: none
            */
            $scope.goBack = function () {
                $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
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