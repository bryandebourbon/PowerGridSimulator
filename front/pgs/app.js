var app = angular.module('PowerGridSimulator', []);

app.controller('PowerGridSimulatorController', function ($scope) {
	firebase.initializeApp(firebaseConfigs);

	/* set initial state to log in */
	$scope.state = 'login';

	/*  
	**	tag: external
	**	use: transition between pages -- pgsStateChanged event gets triggered on page transition (see directive.js)
	**	behavior: store new state variables as global, remove old page, and render new page
	**	input: evt = JavaScript local event handle, args = { state name, other state parameters needed to render new page }
	**	output: none
	*/
	$scope.$on('pgsStateChanged', function (evt, args) {
		_.forEach(args, function (val, key) {
			$scope[key] = val;
		})

		/* trigger Angular re-render */
		$scope.$apply();
	})
});