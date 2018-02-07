var app = angular.module('PowerGridSimulator', []);

app.controller('PowerGridSimulatorController', function ($scope, LoginService, ChallengesService, GridService, EvaluationService, LeaderBoardService) {
	LoginService.init();
	ChallengesService.init();
	GridService.init();
	EvaluationService.init();
	LeaderBoardService.init();

	$scope.state = 'login';

	$scope.$on('pgsStateChanged', function (evt, args) {
		$scope.state = args.state;
	})
});