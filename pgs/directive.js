app.directive('loginDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './_Login.html',
		scope: {
			email: '@',
			password: '@',
			teamname: '@'
		},
		controller: loginDirectiveController
	}
})

var loginDirectiveController = ['$scope', '$rootScope', 'LoginService', function ($scope, $rootScope, $LoginService) {
	$scope.email = '';
	$scope.password = '';
	$scope.teamname = '';

	// uid refers to user id (effectively team id)
	// we later retrieve a list of challenges visible to a uid
	$scope.register = function () {
		$LoginService.register({ email: $scope.email, password: $scope.password, teamname: $scope.teamname })
			.then(function (res) {
				if (res && res.status == 'OK') {
					$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', uid: res.uid, challenges: res.challenges });
				}
			}).catch(function (error) {
				console.log(error);
			})
	}

	$scope.login = function () {
		$LoginService.login({ email: $scope.email, password: $scope.password, teamname: $scope.teamname })
			.then(function (res) {
				if (res && res.status == 'OK') {
					$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', uid: res.uid, challenges: res.challenges });
				}
			}).catch(function (error) {
				console.log(error);
			})
	}
}]

app.directive('challengesDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './_Challenges.html',
		scope: {
			challenges: '=?'
		},
		controller: challengesDirectiveController
	}
})

var challengesDirectiveController = ['$scope', '$rootScope', '$timeout', 'ChallengesService', function ($scope, $rootScope, $timeout, $ChallengesService) {
	$scope.previewChallenge = function (id) {
		$ChallengesService.previewChallenge(id);
	}

	$scope.simulateChallenge = function (id) {
		var res = $ChallengesService.simulateChallenge(id);

		if (res && res.status == 'OK') {
			$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'grid', challenge: res.challenge }); });
		}
	}
}]

app.directive('challengeDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './_Challenge.html',
		scope: {
			challenge: '=?'
		},
		controller: challengeDirectiveController
	}
})

var challengeDirectiveController = ['$scope', '$rootScope', '$timeout', 'ChallengeService', function ($scope, $rootScope, $timeout, $ChallengeService) {
	$scope.tab = 'simulation';

	$scope.switchTab = function (evt) {
		if (evt && evt.currentTarget) {
			$scope.tab = evt.currentTarget.dataset.tab;

			$(evt.currentTarget).addClass('active');
			$(evt.currentTarget).siblings().removeClass('active');
		}
	}

	$scope.submitChallenge = function (challenge) {
		$ChallengeService.submitChallenge(challenge)
			.then(function (res) {
				if (res && res.status == 'OK') {
					$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'evaluation', evaluation: res.evaluation }); });
				}
			}).catch(function (error) {
				console.log(error)
			})

		
	}
}]

app.directive('simulatorDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './_Simulator.html',
		scope: {
			generators: '=?',
			demands: '=?',
			lines: '=?'
		},
		controller: simulatorDirectiveController
	}
})

var simulatorDirectiveController = ['$scope', '$rootScope', '$timeout', 'SimulatorService', function ($scope, $rootScope, $timeout, $SimulatorService) {
	$scope.renderGrid = function () {
		//https://bost.ocks.org/mike/map/
		//https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c
		//http://mtaptich.github.io/d3-lessons/d3-extras/
		//https://embed.plnkr.co/plunk/awGtKX

		var width = 500,
			height = 1000,
			scale = 1200;


		var points = [
			[-79.376220703125, 43.70759350405294],
			[-79.4970703125, 46.34692761055676],
			[-81.32080078125, 48.472921272487824],
			[-89.4287109375, 48.545705491847464],
			[-92.28515625, 52.8823912222619],
			[-86.0888671875, 51.83577752045248],
			[-87.890625, 55.99838095535963],
			[-75.89355468749999, 45.1510532655634],
			[-81.6943359375, 43.004647127794435]
		];

		var generator_type = ["nuclear", "water", "coal", "solar", "wind"];
		var generator_color = ["green", "blue", "grey", "orange", "white"];
		var generator_count = 0;
		//  The projection is used to project geographical coordinates on the SVG
		projection = d3.geo.mercator().scale(scale).translate([width + 1555, height + 460]);

		//  Path is the conversion of geographical shapes (states) to a SVG path 
		path = d3.geo.path().projection(projection);

		//  Map is the SVG which everything is drawn on.
		map = d3.select("#simulator-svg")
			.append("svg")
			.attr("width", width)
			.attr("height", height);
		var gBackground = map.append("g"); // appended first
		var gPathPoints = map.append("g");
		var gDataPoints = map.append("g");

		gDataPoints.selectAll(".point")
			.data(points)
			.enter().append("circle")
			.attr("r", 8)
			.attr("fill", "red")
			.attr("transform", function (d) { return "translate(" + projection(d) + ")"; })
			.on("click", function () {




			})
			.on("dblclick", function () {
				last = d3.select(this).style('fill', generator_color[generator_count])
				this.generator_type = generator_type[generator_count]
				generator_count = (generator_count + 1) % 5

			})
			;

		var line = d3.svg.line()
			.interpolate("cardinal-closed")
			.x(function (d) { return projection(d)[0]; })
			.y(function (d) { return projection(d)[1]; });

		var power_lines = [


			[
				[-79.376220703125, 43.70759350405294],
				[-79.4970703125, 46.34692761055676]
			],// neck to south
			[
				[-79.4970703125, 46.34692761055676],
				[-81.32080078125, 48.472921272487824]
			],// center to neck
			[
				[-81.32080078125, 48.472921272487824],
				[-86.0888671875, 51.83577752045248]
			],// north middle to center middle
			[
				[-92.28515625, 52.8823912222619],
				[-86.0888671875, 51.83577752045248]
			],// north middle
			[
				[-86.0888671875, 51.83577752045248],
				[-87.890625, 55.99838095535963],
			],// most north
			[
				[-86.0888671875, 51.83577752045248],
				[-89.4287109375, 48.545705491847464],
			],// bottom north
			[
				[-79.376220703125, 43.70759350405294],
				[-81.6943359375, 43.004647127794435]
			],// bottom left

			[
				[-75.89355468749999, 45.1510532655634],
				[-79.376220703125, 43.70759350405294]
			]// bottom right
		]

		// store an array with all the lines so you can add circles
		// var linepath = gDataPoints.append("path")
		// 	.data([power_lines])
		// 	.attr("d", line)
		// 	.attr('class', 'journey')
		// 	.attr("fill", "red")
		// 	;
		var linepath = gPathPoints.selectAll(".line")
			.data(power_lines).enter().append("path")
			.attr("d", line)
			.attr('class', 'journey')
			.attr("fill", "red")
			;
		console.log(linepath)

		var circle = gPathPoints.append("circle")
			.attr("r", 4)
			.attr("fill", "green")
			.attr("transform", "translate(" + projection(points[0]) + ")");

		var circle2 = gPathPoints.append("circle")
			.attr("r", 2)
			.attr("fill", "green")
			.attr("transform", "translate(" + projection(points[0]) + ")");

		transition();
		function transition() {
			circle.transition()
				.duration(5000)
				.attrTween("transform", translateAlong(linepath.node()))
				.each("end", transition);
		}
		transition2();
		function transition2() {
			circle2.transition()
				.duration(3000)
				.attrTween("transform", translateAlong2(linepath.node()))
				.each("end", transition2);
		}

		function translateAlong(path) {
			var l = path.getTotalLength();
			return function (d, i, a) {
				return function (t) {
					var p = path.getPointAtLength(t * l);
					return "translate(" + (p.x + 5) + "," + p.y + ")";
				};
			};
		}
		function translateAlong2(path) {
			var l = path.getTotalLength();
			return function (d, i, a) {
				return function (t) {
					var p = path.getPointAtLength(t * l);
					return "translate(" + (p.x - 5) + "," + p.y + ")";
				};
			};
		}

		//  Load state information to create individual state paths
		d3.json("ontario.geo.json", function (error, ont) {
			if (error) throw error;
			gBackground.selectAll("path")
				.attr("width", width)
				.attr("height", height)

				.data(topojson.feature(ont, ont.objects.boarderlines).features)
				.enter().append("path")
				.attr("d", path)
				.attr("class", "state");

		});










	}

	var clickHandler = function (d) {
		$scope.node = _.find($scope.nodes, function (n) { return n.index == d.index; });
		delete $scope.aggregatedGenerator;

		$scope.$apply();
	}

	// demands, generators, lines
	var nodeMap = [	{ index: 0, name: 'Northwest' },
					{ index: 1, name: 'Northeast' },
					{ index: 2, name: 'Ottawa' },
					{ index: 3, name: 'East' },
					{ index: 4, name: 'Toronto' },
					{ index: 5, name: 'Essa' },
					{ index: 6, name: 'Bruce' },
					{ index: 7, name: 'Southwest' },
					{ index: 8, name: 'Niagara' },
					{ index: 9, name: 'West' }];
	
	var processSingleRealReactivePowerArray = function (data) {
		var data24h = data.length != 24 ? [] : data;

		if (data.length == 6) {
			_.forEach(data, function (v) {
				_.forEach([1, 2, 3, 4], function (i) {
					data24h.push(v);
				})
			})
		}

		var res = [];
		_.forEach(data24h, function (v, i) {
			var info = {
				hour: i,
				value: v
			}

			res.push(info);
		})

		return res;
	}
	
	var populateGenerators = function () {
		_.forEach($scope.generators, function (generator) {
			switch (generator.type) {
				case 'G':
					generator.type = 'Gas';
					break;
				case 'H':
					generator.type = 'Hydro';
					break;
				case 'N':
					generator.type = 'Nuclear';
					break;
				case 'S':
					generator.type = 'Solar';
					break;
				case 'W':
					generator.type = 'Water';
					break;
			}
		})
	}
	var populateNodes = function () {
		$scope.nodes = [];

		_.forEach($scope.demands, function (d) {
			var nodeInfo = _.find(nodeMap, function (n) { return n.index == d.node; });
			var name;

			if (nodeInfo) {
				name = nodeInfo.name;
			}

			var node = {
				index: d.node,
				name: name || 'Node ' + d.node,
				demands: {
					real: d.real,
					reactive: d.reactive
				},
				generators: []
			}

			$scope.nodes.push(node);
		})

		$scope.node = _.find($scope.nodes, function (n) { return n.index == 0; });
	}

	var processNodeRealReactiveDemands = function () {
		_.forEach($scope.nodes || [], function (n) {
			var realDemands = n.demands.real;
			var reactiveDemands = n.demands.reactive;

			n.demands.real = processSingleRealReactivePowerArray(realDemands);
			n.demands.reactive = processSingleRealReactivePowerArray(reactiveDemands);
		});
	}
	var visualizeNodeRealReactivePowerDemands = function () {
		var realDemandsContainer = '#node-real-demands';
		var reactiveDemandsContainer = '#node-reactive-demands';

		var ZERO_VALUE = [0, 0, 0, 0, 0, 0];
		var realDemandsData = [($scope.node && $scope.node.demands && $scope.node.demands.real) ? $scope.node.demands.real : ZERO_VALUE];
		var reactiveDemandsData = [($scope.node && $scope.node.demands && $scope.node.demands.reactive) ? $scope.node.demands.reactive : ZERO_VALUE];

		drawLineChart({ container: realDemandsContainer, series: 1, data: realDemandsData });
		drawLineChart({ container: reactiveDemandsContainer, series: 1, data: reactiveDemandsData });
	}

	$scope.viewGeneratorInfo = function (generator) {
		var _generatorProfileTitle = $('#generator-profile-modal .modal-title');
		var _generatorProfileDescription = $('#generator-profile-modal .modal-description');

		_generatorProfileTitle.text(generator.type);
		// _generatorProfileDescription.children().remove();

		_.forEach(generator, function (v, k) {
			var _entry = $('div[data-key="' + k + '"]');
			var _valueContainer = _entry.find('span').last();

			if (k == 'real_capacity') {
				var _svg = _valueContainer.find('svg');

				v = processSingleRealReactivePowerArray(v);

				drawLineChart({ container: '#generator-profile-real-capacity', series: 1, data: [v] });
			} else if (k == 'reactive_capacity') {
				var _svg = _valueContainer.find('svg');

				v = processSingleRealReactivePowerArray(v);

				drawLineChart({ container: '#generator-profile-reactive-capacity', series: 1, data: [v] });
			} else if (k == 'real_cost') {
				_valueContainer.text(v);		
			} else if (k == 'per_node_limit') {
				_valueContainer.text(v);		
			} else {
				_valueContainer.text(v);
			}
		})
	}

	populateGenerators();
	populateNodes();

	processNodeRealReactiveDemands();
	visualizeNodeRealReactivePowerDemands();

	$timeout(function () { $scope.$apply(); });
}]

app.directive('evaluationDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './_Evaluation.html',
		scope: {
			evaluation: '=?'
		},
		controller: evaluationDirectiveController
	}
})

var evaluationDirectiveController = ['$scope', '$rootScope', 'EvaluationService', function ($scope, $rootScope, $EvaluationService) {
	console.log($scope.evaluation);
}]