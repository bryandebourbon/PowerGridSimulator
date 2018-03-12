var app = angular.module('PowerGridSimulator', []);

app.controller('PowerGridSimulatorController', function ($scope, LoginService, ChallengesService, ChallengeService, EvaluationService, LeaderBoardService) {
	LoginService.init();
	EvaluationService.init();
	LeaderBoardService.init();

	$scope.state = 'login';

	$scope.$on('pgsStateChanged', function (evt, args) {
		$scope.state = args.state;

		switch (args.state) {
			case 'challenges':
				ChallengesService.init(args);
				break;
			case 'grid':
				ChallengeService.init(args);
				break;
			case 'evaluation':
				EvaluationService.init(args);
				break;
				
		}

		_.forEach(args, function (val, key) {
			if (key != 'state') {
				$scope[key] = val;
			}
		})

		$scope.$apply();
	})
});