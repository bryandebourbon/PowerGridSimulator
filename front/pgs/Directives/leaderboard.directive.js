app.directive('leaderBoardDirective', function () {
    return {
        restrict: 'EA',
        templateUrl: './Partials/_LeaderBoard.html',
        scope: {
            challenge: '=?',
            evaluation: '=?',
            leaderboard: '=?',
            teamname: '=?'
        },
        controller: ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
            /* define the current viewing criteria */
            $scope.tab = 'environmental-footprint';

            /*  
            **	use: switch between different scoring criteria
            **	behavior: switch to criteria specific view
            **	input: JavaScript native click event
            **	output: none
            */
            $scope.switchTab = function (evt) {
                if (evt && evt.currentTarget) {
                    $scope.tab = evt.currentTarget.dataset.tab;

                    $(evt.currentTarget).addClass('active');
                    $(evt.currentTarget).siblings().removeClass('active');
                }
            }

            /*  
            **	use: hit go back button
            **	behavior: bring user back to preview view - this can be either from the challenge simulation view or the evaluation view
            **	input: none
            **	output: none
            */
            $scope.goBack = function () {
                if ($scope.evaluation) {
                    $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'evaluation', challenge: $scope.challenge, evaluation: $scope.evaluation }); });
                } else {
                    $DataService.getChallenge({ teamname: $.cookie('teamname'), challengeID: $scope.challenge.id })
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
            **	use: hit log out button
            **	behavior: bring user back to log in view
            **	input: none
            **	output: none
            */
            $scope.logOut = function () {
                $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
            }

            /*  
            **  tag: internal
            **	use: process leader board data prior to rendering
            **	behavior: process leader board data prior to rendering due to inconsistency in front end and back end data structures
            **	input: none
            **	output: none
            */
            var processLeaders = function () {
                /* for each category, set leaderboard = [leaders], with leaders = { ranking, name, score } */
                _.forEach($scope.leaderboard, function (b, c) {
                    switch (c) {
                        case 'CO2':
                            $scope.environmentalFootprintBoard = [];

                            var i = 1;
                            _.forEach(b, function (v, k) {
                                var winner = { name: k, score: (Math.round(v * 100) / 100).toFixed(2) };
                                $scope.environmentalFootprintBoard.push(winner);

                                i++;
                            })

                            $scope.environmentalFootprintBoard = _.sortBy($scope.environmentalFootprintBoard, function (w) { return w.score; });
                            _.forEach($scope.environmentalFootprintBoard, function (w, i) {
                                w.ranking = i + 1;
                            })

                            break;
                        case 'cost':
                            $scope.realCostBoard = [];

                            var i = 1;
                            _.forEach(b, function (v, k) {
                                var winner = { name: k, score: (Math.round(v * 100) / 100).toFixed(2) };
                                $scope.realCostBoard.push(winner);

                                i++;
                            })

                            $scope.realCostBoard = _.sortBy($scope.realCostBoard, function (w) { return w.score; });
                            _.forEach($scope.realCostBoard, function (w, i) {
                                w.ranking = i + 1;
                            })

                            break;
                        case 'installation_cost':
                            $scope.installationCostBoard = [];

                            var i = 1;
                            _.forEach(b, function (v, k) {
                                var winner = { name: k, score: (Math.round(v * 100) / 100).toFixed(2) };
                                $scope.installationCostBoard.push(winner);

                                i++;
                            })

                            $scope.installationCostBoard = _.sortBy($scope.installationCostBoard, function (w) { return w.score; });
                            _.forEach($scope.installationCostBoard, function (w, i) {
                                w.ranking = i + 1;
                            })

                            break;

                    }
                })
            }

            processLeaders();
        }]
    }
})