var app = angular.module('PowerGridSimulator', []);

app.controller('PowerGridSimulatorController', function ($scope, LoginService, GridService, EvaluationService, LeaderBoardService) {
	$scope.name = 'John Doe';

	LoginService.init();
	GridService.init();
	EvaluationService.init();
	LeaderBoardService.init();
});