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
        controller: leaderBoardDirectiveController
    }
})
var leaderBoardDirectiveController = ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
    $scope.tab = 'environmental-footprint';

    $scope.switchTab = function (evt) {
        if (evt && evt.currentTarget) {
            $scope.tab = evt.currentTarget.dataset.tab;

            $(evt.currentTarget).addClass('active');
            $(evt.currentTarget).siblings().removeClass('active');
        }
    }

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
    $scope.logOut = function () {
        $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
    }

    var processLeaders = function () {
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
