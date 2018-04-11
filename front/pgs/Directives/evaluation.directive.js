app.directive('evaluationDirective', function () {
    return {
        restrict: 'EA',
        templateUrl: './Partials/_Evaluation.html',
        scope: {
            challenge: '=?',
            evaluation: '=?'
        },
        controller: evaluationDirectiveController
    }
})
var evaluationDirectiveController = ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
    $scope.tab = 'nodes';

    $scope.switchTab = function (evt) {
        if (evt && evt.currentTarget) {
            $scope.tab = evt.currentTarget.dataset.tab;

            if ($scope.tab == 'nodes') {
                $scope.node = _.find($scope.nodes, function (n) { return n.node == 0; });

                $timeout(function () {
                    var _node = $('.nodes').find('[data-index="0"]');
                    _node.addClass('active');
                    _node.siblings().removeClass('active');

                    renderNode($scope.node);
                })
            } else if ($scope.tab == 'lines') {
                $scope.line = _.find($scope.lines, function (l) { return l.from == 0 && l.to == 1; });

                $timeout(function () {
                    var _line = $('.lines').find('[data-from="0"][data-to="1"]');
                    _line.addClass('active');
                    _line.siblings().removeClass('active');

                    renderLine($scope.line);
                })
            }

            $(evt.currentTarget).addClass('active');
            $(evt.currentTarget).siblings().removeClass('active');
        }
    }

    $scope.switchNode = function (evt) {
        if (evt && evt.currentTarget) {
            var index = evt.currentTarget.dataset.index;

            $scope.node = _.find($scope.nodes, function (n) { return n.node == index; });

            $timeout(function () { renderNode($scope.node); });

            $(evt.currentTarget).addClass('active');
            $(evt.currentTarget).siblings().removeClass('active');
        }
    }
    $scope.switchLine = function (evt) {
        if (evt && evt.currentTarget) {
            var from = evt.currentTarget.dataset.from;
            var to = evt.currentTarget.dataset.to;

            $scope.line = _.find($scope.lines, function (l) { return l.from == from && l.to == to; });

            $timeout(function () { renderLine($scope.line); });

            $(evt.currentTarget).addClass('active');
            $(evt.currentTarget).siblings().removeClass('active');
        }
    }

    $scope.viewLeaderBoard = function () {
        Spinner.show();

        $DataService.getLeaderBoard({ teamname: $.cookie('teamname'), challengeID: $scope.challenge.id })
            .then(function (data) {
                Spinner.hide();

                $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'leaderboard', challenge: $scope.challenge, evaluation: $scope.evaluation, leaderboard: data, teamname: $.cookie('teamname') || '' }); });
            }).catch(function (error) {
                console.log(error);
            })
    }

    $scope.goBack = function () {
        Spinner.show();

        $DataService.getChallenge({ teamname: $.cookie('teamname'), challengeID: $scope.challenge.id })
            .then(function (data) {
                Spinner.hide();

                $rootScope.$broadcast('pgsStateChanged', { state: 'grid', challenge: data });
            }).catch(function (error) {
                console.log(error);
            })
    }
    $scope.logOut = function () {
        $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
    }

    var processNodes = function () {
        $scope.nodes = $scope.evaluation.nodes;
        $scope.node = _.find($scope.nodes, function (n) { return n.node == 0; });

        $timeout(function () { renderNode($scope.node); });
    }
    var renderNode = function (node) {
        if (!node) {
            return;
        }

        var generatedRealPower = Chart.processData(node.generated.real);
        var generatedReactivePower = Chart.processData(node.generated.reactive);
        var suppliedRealPower = Chart.processData(node.supplied.real);
        var suppliedReactivePower = Chart.processData(node.supplied.reactive);
        var demandedRealPower = Chart.processData(node.demands.real);
        var demandedReactivePower = Chart.processData(node.demands.reactive);

        Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#node-evaluation-real-power-svg', data: [generatedRealPower, suppliedRealPower, demandedRealPower] });
        Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#node-evaluation-reactive-power-svg', data: [generatedReactivePower, suppliedReactivePower, demandedReactivePower] });
    }

    var processLines = function () {
        $scope.lines = $scope.evaluation.lines;
        $scope.line = _.find($scope.lines, function (l) { return l.from == 0 && l.to == 1; });
    }
    var renderLine = function (line) {
        if (!line) {
            return;
        }

        var realPowerFlow = Chart.processData(line.real_power);
        var reactivePowerFlow = Chart.processData(line.reactive_power);
        var capacity = Chart.processData([line.capacity]);

        Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#line-evaluation-real-power-svg', data: [realPowerFlow, capacity] });
        Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#line-evaluation-reactive-power-svg', data: [reactivePowerFlow, capacity] });
    }

    processNodes();
    processLines();

    var retrieveLeaderBoard = function () {
        return new Promise(function (resolve, reject) {
            Spinner.show();

            $.ajax({
                url: 'http://127.0.0.1:5000/leaderboard/',
                type: 'GET',
                success: function (res) {
                    Spinner.hide();

                    var data = JSON.parse(res);

                    var res = {
                        status: 'OK',
                        leaderboard: data
                    }

                    resolve(res);
                },
                error: function (data) {
                    console.log(data);
                }
            })
        })
    }
}]