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
	$scope.tab = 'statement';

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
		var width = 600;
		var height = 480;

		var color = d3.scaleOrdinal(d3.schemeCategory20);

		var svg = d3.select('#simulator-svg').attr('width', width).attr('height', height);
		
		var node = svg.selectAll('circle').data($scope.nodes).enter()
			.append('circle')
			.attr('cx', function (d) { return (.05 + Math.random()) * width * .9; })
			.attr('cy', function (d) { return (.05 + Math.random()) * height * .9; })
			.attr('r', function (d) { return Math.random() * 50; })
			.style('fill', function (d) { return color(d.name); });
		
		node.append('title').text(function (d) { return d.name; });
		node.on('click', function (d) { return clickHandler(d); });

		// haven't implemented visualization and event handling for links but they can be found on d3 website
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