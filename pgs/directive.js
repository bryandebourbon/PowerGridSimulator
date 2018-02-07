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

var loginDirectiveController = ['$scope', 'LoginService', function ($scope, $LoginService) {
	$scope.username = '';
	$scope.password = '';

	$scope.register = function () {
		$LoginService.register();
	}

	$scope.login = function () {
		$LoginService.login();
	}
}]