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

	$scope.register = function () {
		$LoginService.register();

		$rootScope.$broadcast('pgsStateChanged', { state: 'challenges' });
	}

	$scope.login = function () {
		$LoginService.login();
	
		$rootScope.$broadcast('pgsStateChanged', { state: 'challenges' });
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

	$scope.viewChallenge = function (cid) {
		$ChallengesService.viewChallenge(cid);

		$rootScope.$broadcast('pgsStateChanged', { state: 'grid' });
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
	
}]