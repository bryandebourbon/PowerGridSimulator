app.directive('simulatorDirective', function () {
    return {
        restrict: 'EA',
        templateUrl: './Partials/_Simulator.html',
        scope: {
            challenge: '=?'
        },
        controller: simulatorDirectiveController
    }
})
var simulatorDirectiveController = ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {
    $scope.renderMap = function () {
        Vis.render($scope);
    }

    var populateGenerators = function () {
        _.forEach($scope.challenge.generators, function (generator) {
            var generatorType = _.find(generatorConfigs, function (gt) { return gt.abbreviation == generator.type || gt.type == generator.type; });

            generator.type = generatorType.type;
        })

        $timeout(function () {
            _.forEach($scope.challenge.generators, function (g, i) {
                if (g.count == 0) {
                    var _generatorAddButton = $('.pgs-add-button:eq(' + i + ')');
                    _generatorAddButton.addClass('disabled pgs-disabled');	// this is a hacky fix, ng-disabled not working here
                }
            })
        })
    }
    var populateNodes = function () {
        $scope.challenge.nodes = [];

        _.forEach($scope.challenge.demands, function (d) {
            var nodeInfo = _.find(regionConfigs, function (n) { return n.index == d.node; });
            var name;

            if (nodeInfo) {
                name = nodeInfo.name;
            }

            var node = {
                index: d.node,
                name: name,
                demands: {
                    real: d.real,
                    reactive: d.reactive
                },
                generators: []
            }

            $scope.challenge.nodes.push(node);
        })

        if (_.size($scope.challenge.saved_challenge) != 0) {
            _.forEach($scope.challenge.saved_challenge, function (generators, i) {
                var node = _.find($scope.challenge.nodes, function (n) { return n.index == i; });

                _.forEach(generators, function (count, typeAbbriviation) {
                    var generatorType = _.find(generatorConfigs, function (g) { return g.abbreviation == typeAbbriviation; });
                    if (generatorType) {
                        var type = generatorType.type;
                    }

                    var generator = _.find(node.generators, function (g) { return g.type == type || ''; });

                    if (generator) {
                        generator.count++;
                    } else {
                        var generatorCopy = _.cloneDeep(_.find($scope.challenge.generators, function (g) { return g.type == type; }));
                        generatorCopy.count = 1;

                        node.generators.push(generatorCopy);
                    }

                    var inventoryGenerator = _.find($scope.challenge.generators, function (g) { return g.type == type; });
                    if (inventoryGenerator) {
                        inventoryGenerator.count--;
                    }
                })
            })
        }

        $scope.node = _.head($scope.challenge.nodes);
    }
    var populateLines = function () {
        _.forEach($scope.challenge.lines, function (l) {
            var fromRegion = _.find(regionConfigs, function (n) { return n.index == l.from; }) ? _.find(regionConfigs, function (n) { return n.index == l.from; }).name : '';
            var toRegion = _.find(regionConfigs, function (n) { return n.index == l.to; }) ? _.find(regionConfigs, function (n) { return n.index == l.to; }).name : '';
            var name = fromRegion + ' - ' + toRegion;

            l.fromRegion = fromRegion;
            l.toRegion = toRegion;
            l.name = name;
        })

        $scope.line = _.head($scope.challenge.lines);
    }

    var processNodeRealReactiveDemands = function () {
        _.forEach($scope.challenge.nodes || [], function (n) {
            var realDemands = n.demands.real;
            var reactiveDemands = n.demands.reactive;

            var head = _.head(realDemands);
            if (typeof head == 'number') {
                n.demands.real = Chart.processData(realDemands);
                n.demands.reactive = Chart.processData(reactiveDemands);
            }
        });
    }
    var visualizeNodeRealReactivePowerDemands = function () {
        var realDemandsContainer = '#node-real-demands';
        var reactiveDemandsContainer = '#node-reactive-demands';

        var ZERO_VALUE = [0, 0, 0, 0, 0, 0];
        var realDemandsData = ($scope.node && $scope.node.demands && $scope.node.demands.real) ? $scope.node.demands.real : ZERO_VALUE;
        var reactiveDemandsData = ($scope.node && $scope.node.demands && $scope.node.demands.reactive) ? $scope.node.demands.reactive : ZERO_VALUE;

        Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: realDemandsContainer, data: [realDemandsData] });
        Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: reactiveDemandsContainer, data: [reactiveDemandsData] });
    }

    $scope.viewGeneratorInfo = function (generator) {
        var _generatorProfileTitle = $('#generator-profile-modal .modal-title');
        var _generatorProfileDescription = $('#generator-profile-modal .modal-description');

        _generatorProfileTitle.text(generator.type);

        _.forEach(generator, function (v, k) {
            var _entry = $('div[data-key="' + k + '"]');
            var _valueContainer = _entry.find('span').last();

            if (k == 'real_capacity') {
                var _svg = _valueContainer.find('svg');

                v = Chart.processData(v);

                Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#generator-profile-real-capacity', data: [v] });
            } else if (k == 'reactive_capacity') {
                var _svg = _valueContainer.find('svg');

                v = Chart.processData(v);

                Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#generator-profile-reactive-capacity', data: [v] });
            } else if (k == 'real_cost') {
                var _svg = _valueContainer.find('svg');

                v = Chart.parsePolynomial(v);

                Chart.drawLineChart({ type: 'polynomial', unit: 'Dollars (k)', container: '#generator-profile-real-cost', data: [v] });
            } else if (k == 'per_node_limit') {
                _valueContainer.text(v);
            } else if (k == 'installation_cost') {
                _valueContainer.text('$ ' + (v == 0 ? 0 : (v / 1000).toFixed(2)) + ' M');
            } else if (k == 'unit_CO2') {
                _valueContainer.text((v / 1000).toFixed(2) + ' T');
            }
        })

        var _nonDispatchableInfo = $('.non-dispatchable');
        var _dispatchableInfo = $('.dispatchable');
        var _hydroOnlyInfo = $('.hydro-only');

        if (_.include(['Nuclear', 'Solar', 'Wind'], generator.type)) {
            _nonDispatchableInfo.show();
            _dispatchableInfo.hide();
            _hydroOnlyInfo.hide();
        } else if (generator.type == 'Gas') {
            _nonDispatchableInfo.hide();
            _dispatchableInfo.show();
            _hydroOnlyInfo.hide();
        } else if (generator.type == 'Hydro') {
            _nonDispatchableInfo.hide();
            _dispatchableInfo.show();
            _hydroOnlyInfo.show();
        }
    }
    $scope.addGenerator = function (generator) {
        if (generator.count == 0) {
            Warning.show('No more generator of type ' + generator.type + ' available');
            return;
        }

        var targetBin = _.find($scope.node.generators, function (g) { return g.type == generator.type; });
        var count = targetBin ? targetBin.count + 1 : 1;

        if (count > generator.per_node_limit[$scope.node.index]) {
            Warning.show('Generator count for ' + $scope.node.name + ' exceeds maximum node capacity');
            return;
        }

        if (targetBin) {
            targetBin.count++;
        } else {
            $scope.node.generators.push(_.merge(_.cloneDeep(generator), { count: 1 }));
        }

        generator.count--;

        Vis.addGenerators({ index: $scope.node.index, type: generator.type, count: 1 });
    }
    $scope.removeGenerator = function (generator) {
        var targetBin = _.find($scope.challenge.generators, function (g) { return g.type == generator.type; });
        targetBin.count++;

        if (generator.count > 1) {
            generator.count--;
        } else {
            _.remove($scope.node.generators, function (g) { return g.type == generator.type; });
        }

        Vis.removeGenerators({ index: $scope.node.index, type: generator.type, count: 1 });
    }

    $scope.$watch('target', function (newVal, oldVal) {
        if (newVal == 'node') {
            $timeout(function () { $('.pgs-add-button').attr('disabled', false); });
        } else if (newVal == 'line') {
            $timeout(function () { $('.pgs-add-button').attr('disabled', true); });
        }
    })

    $scope.handleClick = function (args) {
        if (args.type == 'node') {
            $scope.node = _.find($scope.challenge.nodes, function (n) { return n.index == args.index; });
            visualizeNodeRealReactivePowerDemands();

            $scope.target = 'node';
            $timeout(function () { $scope.$apply(); });
        } else if (args.type == 'line') {
            $scope.line = _.find($scope.challenge.lines, function (l) { return l.from == args.source && l.to == args.target; });

            $scope.target = 'line';
            $timeout(function () { $scope.$apply(); });
        } else if (args.type == 'generator') {
            var generator = _.find($scope.challenge.generators, function (g) { return g.type == args.gType; });

            var _generatorModal = $('#generator-profile-modal');
            _generatorModal.modal('show');

            $scope.viewGeneratorInfo(generator);
        } else {
            $scope.target = null;
            $timeout(function () { $scope.$apply(); });
        }
    }
    $scope.handleDrag = function (args) {
        var generator = _.find($scope.challenge.generators, function (g) { return g.type == args.type; });

        if (generator && generator.count > 0) {
            generator.count--;
            generator._selected = true;
        }

        $timeout(function () { $scope.$apply(); });
    }
    $scope.revertDrag = function (args) {
        var generator = _.find($scope.challenge.generators, function (g) { return g.type == args.type; });

        if (generator && generator._selected) {
            generator.count++;
            delete generator._selected;
        }

        $timeout(function () { $scope.$apply(); });
    }
    $scope.handleDrop = function (args) {
        var target = _.find($scope.challenge.nodes, function (n) { return n.index == args.target; });

        if (target) {
            var targetBin = _.find(target.generators, function (g) { return g.type == args.type; });

            if (targetBin) {
                targetBin.count++;
            } else {
                var generator = _.find($scope.challenge.generators, function (g) { return g.type == args.type; });

                target.generators.push(_.merge(_.cloneDeep(generator), { count: 1 }));
            }
        }

        $timeout(function () { $scope.$apply(); });
    }

    populateGenerators();
    populateNodes();
    populateLines();

    processNodeRealReactiveDemands();
    visualizeNodeRealReactivePowerDemands();

    $timeout(function () { $scope.$apply(); });
}]