var app = angular.module('PowerGridSimulator', []);

app.controller('PowerGridSimulatorController', function ($scope, LoginService, GridService, EvaluationService, LeaderBoardService) {
	LoginService.init();
	GridService.init();
	EvaluationService.init();
	LeaderBoardService.init();

	
});