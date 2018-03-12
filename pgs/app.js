var app = angular.module('PowerGridSimulator', []);

app.controller('PowerGridSimulatorController', function ($scope) {
	$scope.state = 'login';

	$scope.$on('pgsStateChanged', function (evt, args) {
		_.forEach(args, function (val, key) {
			$scope[key] = val;
		})

		$scope.$apply();
	})
});