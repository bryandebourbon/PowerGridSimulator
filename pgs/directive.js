app.directive('loginDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './_Login.html',
		scope: {
			username: '@',
			password: '@'
		},
		controller: loginDirectiveController
	}
})

var loginDirectiveController = ['$scope', '$rootScope', 'LoginService', function ($scope, $rootScope, $LoginService) {
	$scope.username = '';
	$scope.password = '';

	// uid refers to user id (effectively team id)
	// we later retrieve a list of challenges visible to a uid
	$scope.register = function () {
		var res = $LoginService.register();

		if (res && res.status == 'OK') {
			$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', uid: res.uid, challenges: res.challenges });
		}
	}

	$scope.login = function () {
		var res = $LoginService.login();

		if (res && res.status == 'OK') {
			$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', uid: res.uid, challenges: res.challenges });
		}
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

var challengesDirectiveController = ['$scope', '$rootScope', 'ChallengesService', function ($scope, $rootScope, $ChallengesService) {
	// $scope.challenges = [   { id: 1, name: 'pgsChallenge', status: 'new' },
	// 						{ id: 3, name: 'pgsChallenge', status: 'new' },
	// 						{ id: 4, name: 'pgsChallenge', status: 'saved' },
	// 						{ id: 11, name: 'pgsChallenge', status: 'new' }];

	// cid refers to challenge id
	// we later retrieve grid layout using cid
	// we later retrieve generator placement using cid + uid combination
	$scope.previewChallenge = function (cid) {
		// show problem statement
		// show minimap contaning grid layout
		$ChallengesService.previewChallenge(cid);
	}

	$scope.simulateChallenge = function (cid) {
		// go to the grid page

		var res = $ChallengesService.simulateChallenge(cid);

		if (res && res.status == 'OK') {
			$rootScope.$broadcast('pgsStateChanged', { state: 'grid', challenge: res.challenge });
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

var challengeDirectiveController = ['$scope', '$rootScope', 'ChallengeService', function ($scope, $rootScope, $ChallengeService) {
	$scope.tab = 'simulation';

	$scope.switchTab = function (evt) {
		if (evt && evt.currentTarget) {
			$scope.tab = evt.currentTarget.dataset.tab;

			$(evt.currentTarget).addClass('active');
			$(evt.currentTarget).siblings().removeClass('active');
		}
	}

	$scope.submitChallenge = function (challenge) {
		var res = $ChallengeService.submitChallenge(challenge);

		if (res && res.status == 'OK') {
			$rootScope.$broadcast('pgsStateChanged', { state: 'evaluation', evaluation: res.evaluation });
		}
	}
}]

app.directive('simulatorDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './_Simulator.html',
		scope: {
			inventory: '=?',
			nodes: '=?',
			links: '=?'
		},
		controller: simulatorDirectiveController
	}
})

var simulatorDirectiveController = ['$scope', '$rootScope', 'SimulatorService', function ($scope, $rootScope, $SimulatorService) {
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

	$scope.node = _.find($scope.nodes, function (n) { return n.index == 1; });

	$scope.removeGenerator = function (generator) {
		_.remove($scope.node.generators, function (g, i) { return g.guid == generator.guid; });

		$scope.inventory.push(generator);

		$scope.aggregatedInventory = $scope.aggregateInventory($scope.inventory);
		$scope.aggregatedGenerator = _.find($scope.aggregatedInventory, function (ag, i) { return ag.type == generator.type; });
	}

	$scope.addGenerator = function (generator) {
		$scope.node.generators.push(generator);

		_.remove($scope.inventory, function (g, i) { return g.guid == generator.guid; });

		$scope.aggregatedInventory = $scope.aggregateInventory($scope.inventory);
		$scope.aggregatedGenerator = _.find($scope.aggregatedInventory, function (ag, i) { return ag.type == generator.type; });
	}

	$scope.generatorFilter = function (generator) {
		return generator && generator.generators && generator.generators.length > 0;
	}

	$scope.aggregateInventory = function (flatInventory) {
		var aggregatedInventory = [];

		_.forEach(flatInventory, function (g, i) {
			var aggregatedGenerator = _.find(aggregatedInventory, function (ai, i) { return ai.type == g.type; });

			if (aggregatedGenerator) {
				aggregatedGenerator.generators.push(g);
			} else {
				aggregatedGenerator = {
					type: g.type,
					generators: [g]
				}

				aggregatedInventory.push(aggregatedGenerator);
			}
		})

		return aggregatedInventory;
	}

	$scope.aggregatedInventory = $scope.aggregateInventory($scope.inventory);

	$scope.viewAggregatedGenerator = function (aggregatedGenerator) {
		$scope.aggregatedGenerator = aggregatedGenerator;
		$scope.expandAggregatedGenerator = true;
	}
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
	// console.log($scope.evaluation);
}]