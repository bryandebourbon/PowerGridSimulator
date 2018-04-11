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
    /*  
	**	use: page on load
	**	behavior: render challenge simulation map
	**	input: none
	**	output: none
	*/
    $scope.renderMap = function () {
        Vis.render($scope);
    }

    /*  
    **  tag: internal
	**	use: on directive mounting
	**	behavior: update generator data structure (for rendering) and render
	**	input: none
	**	output: none
	*/
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
    /*  
    **  tag: internal
	**	use: on directive mounting
	**	behavior: update node data structure (for rendering) and render
	**	input: none
	**	output: none
	*/
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

        /* restore last submitted challenge, if any */
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

        /* set default node */
        $scope.node = _.head($scope.challenge.nodes);
    }
    /*  
    **  tag: internal
	**	use: on directive mounting
	**	behavior: update transmission line data structure (for rendering) and render
	**	input: none
	**	output: none
	*/
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

    /*  
    **  tag: internal
	**	use: render node information pane 
	**	behavior: process node real and reactive demands in preparation for chart rendering
	**	input: none
	**	output: none
	*/
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
    /*  
    **  tag: internal
	**	use: render node information pane 
	**	behavior: visualize node real and reactive demands
	**	input: none
	**	output: none
	*/
    var visualizeNodeRealReactivePowerDemands = function () {
        var realDemandsContainer = '#node-real-demands';
        var reactiveDemandsContainer = '#node-reactive-demands';

        var realDemandsData = ($scope.node && $scope.node.demands && $scope.node.demands.real) ? $scope.node.demands.real : [0, 0, 0, 0, 0, 0];
        var reactiveDemandsData = ($scope.node && $scope.node.demands && $scope.node.demands.reactive) ? $scope.node.demands.reactive : [0, 0, 0, 0, 0, 0];

        Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: realDemandsContainer, data: [realDemandsData] });
        Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: reactiveDemandsContainer, data: [reactiveDemandsData] });
    }

    /*  
	**	use: click on generator type button either in node information pane or inventory pane
	**	behavior: pop up modal showing generator information
	**	input: generator = inventory generator = { type, ... }
	**	output: none
	*/
    $scope.viewGeneratorInfo = function (generator) {
        var _generatorProfileTitle = $('#generator-profile-modal .modal-title');
        var _generatorProfileDescription = $('#generator-profile-modal .modal-description');

        _generatorProfileTitle.text(generator.type);

        /* for each attribute of the generator, do different things */
        _.forEach(generator, function (v, k) {
            var _entry = $('div[data-key="' + k + '"]');
            var _valueContainer = _entry.find('span').last();

            if (k == 'real_capacity') {
                /* render chart */
                var _svg = _valueContainer.find('svg');

                v = Chart.processData(v);

                Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#generator-profile-real-capacity', data: [v] });
            } else if (k == 'reactive_capacity') {
                /* render chart */
                var _svg = _valueContainer.find('svg');

                v = Chart.processData(v);

                Chart.drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#generator-profile-reactive-capacity', data: [v] });
            } else if (k == 'real_cost') {
                /* render chart */
                var _svg = _valueContainer.find('svg');

                v = Chart.parsePolynomial(v);

                Chart.drawLineChart({ type: 'polynomial', unit: 'Dollars (k)', container: '#generator-profile-real-cost', data: [v] });
            } else if (k == 'per_node_limit') {
                /* show number */
                _valueContainer.text(v);
            } else if (k == 'installation_cost') {
                /* show $ number */
                _valueContainer.text('$ ' + (v == 0 ? 0 : (v / 1000).toFixed(2)) + ' M');
            } else if (k == 'unit_CO2') {
                /* show decimal number */
                _valueContainer.text((v / 1000).toFixed(2) + ' T');
            }
        })

        /* conditionally display additional educational information depending on generator type */
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
    /*  
	**	use: click add button beside generator type on inventory pane
	**	behavior: increase node generator count by 1 and decrease inventory generator count by 1
	**	input: generator = inventory generator = { type, count, ... }
	**	output: none
	*/
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

        /* add generator in the map visualization simultaneously */
        Vis.addGenerators({ index: $scope.node.index, type: generator.type, count: 1 });
    }
    /*  
	**	use: click remove button beside generator type on region information pane
	**	behavior: decrease node generator count by 1 and increase inventory generator count by 1
	**	input: generator = inventory generator = { type, count, ... }
	**	output: none
	*/
    $scope.removeGenerator = function (generator) {
        var targetBin = _.find($scope.challenge.generators, function (g) { return g.type == generator.type; });
        targetBin.count++;

        if (generator.count > 1) {
            generator.count--;
        } else {
            _.remove($scope.node.generators, function (g) { return g.type == generator.type; });
        }

        /* remove generator in the map visualization simultaneously */
        Vis.removeGenerators({ index: $scope.node.index, type: generator.type, count: 1 });
    }

    /*  
	**	use: click on node or transmission line or generator or empty space on the map
	**	behavior: render information corresponding to the element being clicked
	**	input: args = { type, other information that allows us to point to and render information about target element }
	**	output: none
	*/
    $scope.handleClick = function (args) {
        if (args.type == 'node') {
            /* case 1: type == node - find node with node index and visualize */
            $scope.node = _.find($scope.challenge.nodes, function (n) { return n.index == args.index; });
            visualizeNodeRealReactivePowerDemands();

            $scope.target = 'node';
            $timeout(function () { $scope.$apply(); });
        } else if (args.type == 'line') {
            /* case 2: type == line - find transmission line with source and target and visualize */
            $scope.line = _.find($scope.challenge.lines, function (l) { return l.from == args.source && l.to == args.target; });

            $scope.target = 'line';
            $timeout(function () { $scope.$apply(); });
        } else if (args.type == 'generator') {
            /* case 3: type == generator - find generator with generator type and visualize */
            var generator = _.find($scope.challenge.generators, function (g) { return g.type == args.gType; });

            var _generatorModal = $('#generator-profile-modal');
            _generatorModal.modal('show');

            $scope.viewGeneratorInfo(generator);
        } else {
            /* case 4: type == none - clear all information display and show instructions */
            $scope.target = null;
            $timeout(function () { $scope.$apply(); });
        }
    }
    /*  
	**	use: start dragging generator from inventory
	**	behavior: update inventory generator count (-1)
	**	input: args = { type }
	**	output: none
	*/
    $scope.handleDrag = function (args) {
        var generator = _.find($scope.challenge.generators, function (g) { return g.type == args.type; });

        if (generator && generator.count > 0) {
            generator.count--;
            generator._selected = true;
        }

        $timeout(function () { $scope.$apply(); });
    }
    /*  
	**	use: generator being dragged drops onto invalid positions
	**	behavior: revert modifications on inventory generator count (+1)
	**	input: args = { type }
	**	output: none
	*/
    $scope.revertDrag = function (args) {
        var generator = _.find($scope.challenge.generators, function (g) { return g.type == args.type; });

        if (generator && generator._selected) {
            generator.count++;
            delete generator._selected;
        }

        $timeout(function () { $scope.$apply(); });
    }
    /*  
	**	use: drop generator onto map region
	**	behavior: update region generator count
	**	input: args = { type, target }
	**	output: none
	*/
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

    /* populate data view for generators, nodes, and lines on page landing */
    populateGenerators();
    populateNodes();
    populateLines();

    processNodeRealReactiveDemands();
    visualizeNodeRealReactivePowerDemands();

    $timeout(function () { $scope.$apply(); });
}]