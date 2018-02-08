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
		$LoginService.register();

		$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', uid: 1 });
	}

	$scope.login = function () {
		$LoginService.login();
	
		$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', uid: 1 });
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
	$scope.challenges = [   { id: 1, name: 'pgsChallenge', status: 'new' },
							{ id: 3, name: 'pgsChallenge', status: 'new' },
							{ id: 4, name: 'pgsChallenge', status: 'saved' },
							{ id: 11, name: 'pgsChallenge', status: 'new' }];

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

		var uid = 1;
		$ChallengesService.simulateChallenge(cid, uid);

		$rootScope.$broadcast('pgsStateChanged', { state: 'grid', cid: cid });
	}
}]

app.directive('challengeDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './_Challenge.html',
		scope: {
			challenges: '=?'
		},
		controller: challengeDirectiveController
	}
})

var challengeDirectiveController = ['$scope', '$rootScope', 'ChallengeService', function ($scope, $rootScope, $ChallengeService) {
	$scope.challenge = {
		id: 1,
		name: 'Challenge 1',
		description: 'This is the challenge description',
		map: {
			nodes: [{ id: 1, name: 'Toronto', cx: 100, cy: 100, r: 30, demand: 'This is the demand profile for Toronto', generators: [1, 2, 3]},
					{ id: 2, name: 'Hamilton', cx: 200, cy: 200, r: 20, demand: 'This is the demand profile for Hamilton', generators: [3, 2, 5] },
					{ id: 3, name: 'Ajax', cx: 300, cy: 100, r: 18, demand: 'This is the demand profile for Ajax', generators: [1, 4, 6] },
					{ id: 4, name: 'Brampton', cx: 200, cy: 100, r: 12, demand: 'This is the demand profile for Brampton', generators: [0, 1, 3] }],
			links: [{ source: 1, target: 2, value: 3 },
					{ source: 1, target: 3, value: 4 },
					{ source: 1, target: 4, value: 3 },
					{ source: 2, target: 3, value: 6 }]
		}
	}

	$scope.tab = 'statement';

	$scope.switchTab = function (evt) {
		if (evt && evt.currentTarget) {
			$scope.tab = evt.currentTarget.dataset.tab;

			$(evt.currentTarget).addClass('active');
			$(evt.currentTarget).siblings().removeClass('active');
		}
	}
}]

app.directive('simulatorDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './_Simulator.html',
		scope: {
			map: '=?'
		},
		controller: simulatorDirectiveController
	}
})

var simulatorDirectiveController = ['$scope', '$rootScope', 'SimulatorService', function ($scope, $rootScope, $SimulatorService) {
	// $scope.map = {
	// 	nodes: [{ id: 1, name: 'Toronto', group: 1 },
	// 			{ id: 2, name: 'Hamilton', group: 1 },
	// 			{ id: 3, name: 'Ajax', group: 1 },
	// 			{ id: 4, name: 'Brampton', group: 1 }],
	// 	links: [{ source: 1, target: 2, value: 1 },
	// 			{ source: 1, target: 3, value: 1 },
	// 			{ source: 1, target: 4, value: 1 },
	// 			{ source: 2, target: 3, value: 1 }]
	// }

	$scope.renderGrid = function () {
		var nodes = $scope.map.nodes;
		var links = $scope.map.links;

		var dragStartHandler = function (d) {
			if (!d3.event.active) {
				simulation.alphaTarget(0.3).restart();
			}

			d.fx = d.x;
			d.fy = d.y;
		}

		var dragHandler = function (d) {
			d.fx = d3.event.x;
			d.fy = d3.event.y;
		}

		var dragEndHandler = function (d) {
			if (!d3.event.active) {
				simulation.alphaTarget(0);
			}

			d.fx = null;
			d.fy = null;
		}

		var tickHanlder = function () {
			link.attr('x1', function (d) { return d.source.x; })
				.attr('y1', function (d) { return d.source.y; })
				.attr('x2', function (d) { return d.target.x; })
				.attr('y2', function (d) { return d.target.y; });

			node.attr('cx', function (d) { return d.x; })
				.attr('cy', function (d) { return d.y; });
		}
		
		var width = 600;
		var height = 480;

		var color = d3.scaleOrdinal(d3.schemeCategory20);

		var svg = d3.select('#simulator-svg').attr('width', width).attr('height', height);
		
		var node = svg.selectAll('circle').data(nodes).enter()
			.append('circle')
			.attr('cx', function (d) { return d.cx; })
			.attr('cy', function (d) { return d.cy; })
			.attr('r', function (d) { return d.r; })
			.style('fill', function (d) { return color(d.name); });
		
		node.append('title').text(function (d) { return d.name; });
		node.on('click', function (d) { return clickHandler(d); })
	}

	var clickHandler = function (d) {
		$scope.node = _.find($scope.map.nodes, function (n) { return n.id == d.id; });

		$scope.$apply();
	}

	$scope.node = _.find($scope.map.nodes, function (n) { return n.id == 1; });
}]