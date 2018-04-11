app.directive('evaluationDirective', function () {
    return {
        restrict: 'EA',
        templateUrl: './Partials/_Evaluation.html',
        scope: {
            challenge: '=?',
            evaluation: '=?'
        },
        controller: ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
            /* define current tab for detailed evaluation pane */
            $scope.tab = 'nodes';

            /*  
            **	use: switch between detailed evaluation node view and detailed evaluation transmission line view
            **	behavior: display detailed evaluation information regarding first item of the category
            **	input: JavaScript native click event
            **	output: none
            */
            $scope.switchTab = function (evt) {
                if (evt && evt.currentTarget) {
                    /* switch tab, conditionally show only node or transmission line information */
                    $scope.tab = evt.currentTarget.dataset.tab;

                    if ($scope.tab == 'nodes') {
                        /* case 1: nodes */
                        $timeout(function () {
                            var _node = $('.nodes').find('[data-index="0"]');
                            _node.addClass('active');
                            _node.siblings().removeClass('active');

                            /* render detailed evaluation information regarding the first node */
                            $scope.node = _.find($scope.nodes, function (n) { return n.node == 0; });
                            renderNode($scope.node);
                        })
                    } else if ($scope.tab == 'lines') {
                        /* case 1: nodes */
                        $timeout(function () {
                            var _line = $('.lines').find('[data-from="0"][data-to="1"]');
                            _line.addClass('active');
                            _line.siblings().removeClass('active');

                            /* render detailed evaluation information regarding the first transmission line */
                            $scope.line = _.find($scope.lines, function (l) { return l.from == 0 && l.to == 1; });
                            renderLine($scope.line);
                        })
                    }

                    $(evt.currentTarget).addClass('active');
                    $(evt.currentTarget).siblings().removeClass('active');
                }
            }

            /*  
            **	use: click on certain node name in detailed evaluation pane
            **	behavior: display detailed information regarding the node selected
            **	input: JavaScript native click event
            **	output: none
            */
            $scope.switchNode = function (evt) {
                if (evt && evt.currentTarget) {
                    var index = evt.currentTarget.dataset.index;

                    /* re-render the line information */
                    $scope.node = _.find($scope.nodes, function (n) { return n.node == index; });
                    $timeout(function () { renderNode($scope.node); });

                    $(evt.currentTarget).addClass('active');
                    $(evt.currentTarget).siblings().removeClass('active');
                }
            }
            /*  
            **	use: click on certain transmission line name in detailed evaluation pane
            **	behavior: display detailed information regarding the transmission line selected
            **	input: JavaScript native click event
            **	output: none
            */
            $scope.switchLine = function (evt) {
                if (evt && evt.currentTarget) {
                    var from = evt.currentTarget.dataset.from;
                    var to = evt.currentTarget.dataset.to;

                    /* re-render the line information */
                    $scope.line = _.find($scope.lines, function (l) { return l.from == from && l.to == to; });
                    $timeout(function () { renderLine($scope.line); });

                    $(evt.currentTarget).addClass('active');
                    $(evt.currentTarget).siblings().removeClass('active');
                }
            }

            /*  
            **	use: hit leader board button
            **	behavior: bring user back to challenge specific leaderboard view
            **	input: none
            **	output: none
            */
            $scope.viewLeaderBoard = function () {
                Spinner.show();

                /* retrieve leaderboard information specific to this challenge */
                $DataService.getLeaderBoard({ teamname: $.cookie('teamname'), challengeID: $scope.challenge.id })
                    .then(function (data) {
                        Spinner.hide();

                        $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'leaderboard', challenge: $scope.challenge, evaluation: $scope.evaluation, leaderboard: data, teamname: $.cookie('teamname') || '' }); });
                    }).catch(function (error) {
                        console.log(error);
                    })
            }

            /*  
            **	use: hit go back button
            **	behavior: bring user back to challenge simulation view
            **	input: none
            **	output: none
            */
            $scope.goBack = function () {
                Spinner.show();

                /* retrieve challenge definition in case challenge definition has been modified by external parties */
                $DataService.getChallenge({ teamname: $.cookie('teamname'), challengeID: $scope.challenge.id })
                    .then(function (data) {
                        Spinner.hide();

                        $rootScope.$broadcast('pgsStateChanged', { state: 'grid', challenge: data });
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

            /*  
            **  tag: internal
            **	use: on loading detailed evaluation view
            **	behavior: identify and render default node
            **	input: none
            **	output: none
            */
            var processNodes = function () {
                $scope.nodes = $scope.evaluation.nodes;
                $scope.node = _.find($scope.nodes, function (n) { return n.node == 0; });

                $timeout(function () { renderNode($scope.node); });
            }
            /*  
            **  tag: internal
            **	use: render single node detailed evaluation information
            **	behavior: process and plot real and reactive power passing node (demand, supplied, generated)
            **	input: node = { demand, supplied, generated }
            **	output: none
            */
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

            /*  
            **  tag: internal
            **	use: on loading detailed evaluation view
            **	behavior: identify default transmission line (not render default transmission line because we land on "nodes" view when we first render the page)
            **	input: none
            **	output: none
            */
            var processLines = function () {
                $scope.lines = $scope.evaluation.lines;
                $scope.line = _.find($scope.lines, function (l) { return l.from == 0 && l.to == 1; });
            }
            /*  
            **  tag: internal
            **	use: render single transmission line detailed evaluation information
            **	behavior: process and plot real and reactive power flow in line
            **	input: line = { real_power, reactive_power, capacity }
            **	output: none
            */
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

            /* process and render nodes and lines on page landing */
            processNodes();
            processLines();
        }]
    }
})