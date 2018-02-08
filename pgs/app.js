var app = angular.module('PowerGridSimulator', []);

app.controller('PowerGridSimulatorController', function ($scope, LoginService, ChallengesService, ChallengeService, EvaluationService, LeaderBoardService) {
	LoginService.init();
	ChallengesService.init();
	ChallengeService.init();
	EvaluationService.init();
	LeaderBoardService.init();

	$scope.state = 'login';

	$scope.$on('pgsStateChanged', function (evt, args) {
		$scope.state = args.state;
	})
});