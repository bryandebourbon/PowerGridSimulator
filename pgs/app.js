var app = angular.module('PowerGridSimulator', []);

app.controller('PowerGridSimulatorController', function ($scope, LoginService) {
	LoginService.init();

	$scope.state = 'login';

	$scope.$on('pgsStateChanged', function (evt, args) {
		$scope.state = args.state;

		_.forEach(args, function (val, key) {
			if (key != 'state') {
				$scope[key] = val;
			}
		})

		$scope.$apply();
	})
});