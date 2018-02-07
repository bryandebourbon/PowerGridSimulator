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

app.directive('gridDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './_Grid.html',
		scope: {
			challenges: '=?'
		},
		controller: gridDirectiveController
	}
})

var gridDirectiveController = ['$scope', '$rootScope', 'GridService', function ($scope, $rootScope, $GridService) {
	$scope.challenge = {}
}]