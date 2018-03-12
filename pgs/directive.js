app.directive('loginDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './Partials/_Login.html',
		scope: {
			email: '@',
			password: '@',
			teamname: '@'
		},
		controller: loginDirectiveController
	}
})

var loginDirectiveController = ['$scope', '$rootScope', 'DataService', function ($scope, $rootScope, $DataService) {
	$scope.email = '';
	$scope.password = '';
	$scope.teamname = '';

	// uid refers to user id (effectively team id)
	// we later retrieve a list of challenges visible to a uid
	$scope.register = function () {
		var user = { email: $scope.email, password: $scope.password, teamname: $scope.teamname };

		var _authErrorContainer = $('#auth-error-container');
		var _invalidInputHeader = $('#invalid-input-header');
		var _firebaseAuthErrorHeader = $('#firebase-auth-error-header');
		var _authErrorMessage = $('#auth-error-message');
		var _teamCodeMessage = $('#team-code-message');

		_authErrorMessage.text('');

		_authErrorContainer.hide();
		_invalidInputHeader.hide();
		_firebaseAuthErrorHeader.hide();
		_authErrorMessage.hide();
		_teamCodeMessage.hide();

		if (user.email && user.email.length < 1) {
			_authErrorContainer.show();
			_invalidInputHeader.show();
			_authErrorMessage.show();

			var errorMessage = 'Email field should not be empty.';
			_authErrorMessage.text(errorMessage);

			return;
		}
		if (user.password && user.password.length < 5) {
			_authErrorContainer.show();
			_invalidInputHeader.show();
			_authErrorMessage.show();

			var errorMessage = 'Password field should be at least 6 characters.';
			_authErrorMessage.text(errorMessage);

			return;
		}
		if (user.teamname && user.teamname.length < 1) {
			_authErrorContainer.show();
			_invalidInputHeader.show();
			_authErrorMessage.show();

			var errorMessage = 'Teamname field should not be empty.';
			_authErrorMessage.text(errorMessage);

			return;
		}

		// Sign in with email and pass.
		firebase.auth().createUserWithEmailAndPassword(user.email, user.password)
			.then(function (firebaseUser) {
				firebaseUser.updateProfile({
					displayName: user.teamname
				}).then(function () {
					// Authenticate team.
					var teamsRef = firebase.database().ref().child('teams');
					teamsRef.orderByChild('team_name').equalTo(user.teamname).once('value', team => {
						const data = team.val();
						if (data) {
							// enter code and check.
							var secretCode = _.keys(data)[0];

							var _teamSecretCodeModal = $('#team-secret-code-modal');
							var _distributeTeamSecretCode = $('#distribute-team-secret-code');
							var _collectTeamSecretCode = $('#collect-team-secret-code');
							var _secretCodeInput = $('#secret-code-input');

							_distributeTeamSecretCode.hide();
							_collectTeamSecretCode.show();

							_secretCodeInput.val('');

							$('#team-secret-code-modal').modal('show');

							$('#submit-secret-code').on('click', function (evt) {
								var inputCode = $('#secret-code-input').val();

								if (inputCode == secretCode) {
									$('#team-secret-code-modal').modal('hide');

									showSpinner();
									
									$DataService.getChallenge({ teamname: user.teamname, challengeID: 10 })
										.then(function (data) {
											hideSpinner();

											$.cookie('teamname', $scope.teamname);
											$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: [data] });
										}).catch(function (error) {
											console.log(error);
										})
								} else {
									showWarning('Wrong team secret code, please re-enter.');
								}
							})
						} else {
							// else if team doesn't exist, push to teams/ db.
							var secretCode = teamsRef.push().key;
							teamsRef.orderByChild('team_id').limitToLast(1).once('value', lastTeam => {
								const lastTeamData = Object.values(lastTeam.val())[0];
								var teamID = 1 + +lastTeamData.team_id;
								var newTeam = {};
								newTeam[secretCode] = {
									'team_id': teamID,
									'team_name': user.teamname
								};
								teamsRef.update(newTeam);

								var _teamSecretCodeModal = $('#team-secret-code-modal');
								var _distributeTeamSecretCode = $('#distribute-team-secret-code');
								var _collectTeamSecretCode = $('#collect-team-secret-code');
								var _secretCode = $('.pgs-secret-code');
								var _submitSecretCodeButton = $('#submit-secret-code');

								_distributeTeamSecretCode.show();
								_collectTeamSecretCode.hide();
								_submitSecretCodeButton.hide();

								_secretCode.text(secretCode);

								$('#team-secret-code-modal').modal('show');

								$('#team-secret-code-modal').on('hide.bs.modal', function (evt) {
									showSpinner();

									$DataService.getChallenge({ teamname: user.teamname, challengeID: 10 })
										.then(function (data) {
											hideSpinner();

											$.cookie('teamname', $scope.teamname);
											$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: [data] });
										}).catch(function (error) {
											console.log(error);
										})
								})
							});
						}
					});

				}, function (error) {
					console.log('could not update your team');
				});
			}, function (error) {
				_authErrorContainer.show();
				_firebaseAuthErrorHeader.show();
				_authErrorMessage.show();

				_authErrorMessage.text(error.message);
			})
	}

	$scope.login = function () {
		var user = { email: $scope.email, password: $scope.password || '', teamname: $scope.teamname || '' };

		var _authErrorContainer = $('#auth-error-container');
		var _invalidInputHeader = $('#invalid-input-header');
		var _firebaseAuthErrorHeader = $('#firebase-auth-error-header');
		var _authErrorMessage = $('#auth-error-message');

		_authErrorMessage.text('');

		_authErrorContainer.hide();
		_invalidInputHeader.hide();
		_firebaseAuthErrorHeader.hide();
		_authErrorMessage.hide();

		if (user.email && user.email.length < 1) {
			_authErrorContainer.show();
			_invalidInputHeader.show();
			_authErrorMessage.show();

			var errorMessage = 'Email field should not be empty.';
			_authErrorMessage.text(errorMessage);

			return;
		}
		if (user.password && user.password.length < 1) {
			_authErrorContainer.show();
			_invalidInputHeader.show();
			_authErrorMessage.show();

			var errorMessage = 'Password field should not be empty.';
			_authErrorMessage.text(errorMessage);

			return;
		}
		if (user.teamname && user.teamname.length < 1) {
			_authErrorContainer.show();
			_invalidInputHeader.show();
			_authErrorMessage.show();

			var errorMessage = 'Teamname field should not be empty.';
			_authErrorMessage.text(errorMessage);

			return;
		}

		firebase.auth().signInWithEmailAndPassword(user.email, user.password).catch(function (error) {
			_authErrorContainer.show();
			_firebaseAuthErrorHeader.show();
			_authErrorMessage.show();

			_authErrorMessage.text(error.message);

			return;
		});

		showSpinner();

		$DataService.getChallenge({ teamname: user.teamname, challengeID: 10 })
			.then(function (data) {
				hideSpinner();
				
				$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: [data] });
			}).catch(function (error) {
				reject(error);
			})
	}
}]

app.directive('challengesDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './Partials/_Challenges.html',
		scope: {
			challenges: '=?'
		},
		controller: challengesDirectiveController
	}
})

var challengesDirectiveController = ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {
	var processChallenges = function () {
		_.forEach($scope.challenges, function (c) {
			if (_.size(c.saved_challenge) == 0) {
				c.saved = 'False';
			} else {
				c.saved = 'True';
			}
		})
	}

	$scope.previewChallenge = function (id) {
		var challenge = _.find($scope.challenges, function (c) { return c.id == id; });

		if (challenge) {
			var _previewModalTitle = $('.modal-title');
			var _previewModalDescription = $('.modal-description');

			_previewModalTitle.text(challenge.name);
			_previewModalDescription.text(challenge.description);
		}
	}
	$scope.simulateChallenge = function (id) {
		var challenge = _.find($scope.challenges, function (c) { return c.id == id; });

		if (challenge) {
			$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'grid', challenge: challenge }); });
		}
	}

	$scope.goBack = function () {
		$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
	}

	processChallenges();
}]

app.directive('challengeDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './Partials/_Challenge.html',
		scope: {
			challenge: '=?'
		},
		controller: challengeDirectiveController
	}
})

var challengeDirectiveController = ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
	$scope.tab = 'simulation';

	$scope.switchTab = function (evt) {
		if (evt && evt.currentTarget) {
			$scope.tab = evt.currentTarget.dataset.tab;

			$(evt.currentTarget).addClass('active');
			$(evt.currentTarget).siblings().removeClass('active');
		}
	}

	$scope.submitChallenge = function () {
		showSpinner();

		$DataService.submitChallenge({ challenge: $scope.challenge, teamname: $.cookie('teamname'), challengeID: 10 })
			.then(function (data) {
				hideSpinner();

				if (data.success) {
					$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'evaluation', evaluation: data.eval }); });
				} else {
					showWarning(data.message);
				}
			}).catch(function (error) {
				console.log(error);
			})
	}

	$scope.goBack = function () {
		$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: [$scope.challenge] }); });
	}
}]

app.directive('simulatorDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './Partials/_Simulator.html',
		scope: {
			challenge: '=?'
		},
		controller: simulatorDirectiveController
	}
})
var simulatorDirectiveController = ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {
	$scope.renderGrid = function () {
		//https://bost.ocks.org/mike/map/
		//https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c
		//http://mtaptich.github.io/d3-lessons/d3-extras/
		//https://embed.plnkr.co/plunk/awGtKX

		var width = 500,
			height = 1000,
			scale = 1200;


		var points = [
			[-79.376220703125, 43.70759350405294],
			[-79.4970703125, 46.34692761055676],
			[-81.32080078125, 48.472921272487824],
			[-89.4287109375, 48.545705491847464],
			[-92.28515625, 52.8823912222619],
			[-86.0888671875, 51.83577752045248],
			[-87.890625, 55.99838095535963],
			[-75.89355468749999, 45.1510532655634],
			[-81.6943359375, 43.004647127794435]
		];

		var generator_type = ["nuclear", "wind", "coal", "solar", "wind"];
		var generator_color = ["green", "blue", "grey", "orange", "white"];
		var generator_count = 0;
		//  The projection is used to project geographical coordinates on the SVG
		projection = d3.geo.mercator().scale(scale).translate([width + 1555, height + 460]);

		//  Path is the conversion of geographical shapes (states) to a SVG path 
		path = d3.geo.path().projection(projection);

		//  Map is the SVG which everything is drawn on.
		map = d3.select("#simulator-svg")
			.append("svg")
			.attr("width", width)
			.attr("height", height);
		var gBackground = map.append("g"); // appended first
		
		var gPathPoints = map.append("g");
		var gDataPoints = map.append("g");

		var gPowerZones = map.append("g");

		// gDataPoints.selectAll(".point")
		// 	.data(points)
		// 	.enter().append("circle")
		// 	.attr("r", 8)
		// 	.attr("fill", "red")
		// 	.attr("transform", function (d) { return "translate(" + projection(d) + ")"; })
		// 	.on("click", function () {




		// 	})
		// 	.on("dblclick", function () {
		// 		last = d3.select(this).style('fill', generator_color[generator_count])
		// 		this.generator_type = generator_type[generator_count]
		// 		generator_count = (generator_count + 1) % 5

		// 	})
		// 	;

		var line = d3.svg.line()
			.interpolate("cardinal-closed")
			.x(function (d) { return projection(d)[0]; })
			.y(function (d) { return projection(d)[1]; });

		var power_lines = [


			[
				[-79.376220703125, 43.70759350405294],
				[-79.4970703125, 46.34692761055676]
			],// neck to south
			[
				[-79.4970703125, 46.34692761055676],
				[-81.32080078125, 48.472921272487824]
			],// center to neck
			[
				[-81.32080078125, 48.472921272487824],
				[-86.0888671875, 51.83577752045248]
			],// north middle to center middle
			[
				[-92.28515625, 52.8823912222619],
				[-86.0888671875, 51.83577752045248]
			],// north middle
			[
				[-86.0888671875, 51.83577752045248],
				[-87.890625, 55.99838095535963],
			],// most north
			[
				[-86.0888671875, 51.83577752045248],
				[-89.4287109375, 48.545705491847464],
			],// bottom north
			[
				[-79.376220703125, 43.70759350405294],
				[-81.6943359375, 43.004647127794435]
			],// bottom left

			[
				[-75.89355468749999, 45.1510532655634],
				[-79.376220703125, 43.70759350405294]
			]// bottom right
		]

		// store an array with all the lines so you can add circles
		// var linepath = gDataPoints.append("path")
		// 	.data([power_lines])
		// 	.attr("d", line)
		// 	.attr('class', 'journey')
		// 	.attr("fill", "red")
		// 	;
		// var linepath = gPathPoints.selectAll(".line")
		// 	.data(power_lines).enter().append("path")
		// 	.attr("d", line)
		// 	.attr('class', 'journey')
		// 	.attr("fill", "red")
		// 	;
		// console.log(linepath)

		// var circle = gPathPoints.append("circle")
		// 	.attr("r", 4)
		// 	.attr("fill", "green")
		// 	.attr("transform", "translate(" + projection(points[0]) + ")");

		// var circle2 = gPathPoints.append("circle")
		// 	.attr("r", 2)
		// 	.attr("fill", "green")
		// 	.attr("transform", "translate(" + projection(points[0]) + ")");

		// transition();
		// function transition() {
		// 	circle.transition()
		// 		.duration(5000)
		// 		.attrTween("transform", translateAlong(linepath.node()))
		// 		.each("end", transition);
		// }
		// transition2();
		// function transition2() {
		// 	circle2.transition()
		// 		.duration(3000)
		// 		.attrTween("transform", translateAlong2(linepath.node()))
		// 		.each("end", transition2);
		// }

		// function translateAlong(path) {
		// 	var l = path.getTotalLength();
		// 	return function (d, i, a) {
		// 		return function (t) {
		// 			var p = path.getPointAtLength(t * l);
		// 			return "translate(" + (p.x + 5) + "," + p.y + ")";
		// 		};
		// 	};
		// }
		// function translateAlong2(path) {
		// 	var l = path.getTotalLength();
		// 	return function (d, i, a) {
		// 		return function (t) {
		// 			var p = path.getPointAtLength(t * l);
		// 			return "translate(" + (p.x - 5) + "," + p.y + ")";
		// 		};
		// 	};
		// }

		//  Load state information to create individual state paths
		d3.json("ontario.geo.json", function (error, ont) {
			if (error) throw error;
			gBackground.selectAll("path")
				.attr("width", width)
				.attr("height", height)

				.data(topojson.feature(ont, ont.objects.boarderlines).features)
				.enter().append("path")
				.attr("d", path)
				.attr("class", "state");

		});
		
	// 	filenames = ["Bruce.geo.topojson",
	// 				 "East.geo.topojson",
	// 				 "Essa.geo.topojson",
	// 				 "Niagara.geo.topojson",
	// 				 "Northeast.geo.topojson",
	// 				 "Northwest.geo.topojson",
	// 				 "Ottawa.geo.topojson",
	// 				 "Southwest.geo.topojson",
	// 				 "Toronto.geo.topojson",
	// 				 "West.geo.topojson",
	// 				]
	// 		//	for (i=0; i<filenames.length; i++){
		

	// 	var tester = function (i) {
	// 		pwr_colors = ["green", "yellow", "red", "purple", "blue", "orange", "pink", "red", "purple", "blue"]


	// 	filename = filenames[i]
	
	// 	//  Load state information to create individual state paths
	// 	d3.json(filename, function (error, pwr) {
	// 		if (error) throw error;
	// 		map.append("g").selectAll("path")
	// 			.attr("width", width)
	// 			.attr("height", height)

	// 			.data(topojson.feature(pwr, pwr.objects.boarderlines).features)
	// 			.enter().append("path")
	// 			.attr("d", path)
	// 			.attr("class", "pwrRegions")
	// 			.style("fill", pwr_colors[i])
	// 			.style("opacity", "0.5"); 


	// 	});
	// }

	// tester(5);
	// 	tester(0);
	// 	tester(1);
	// 	tester(2);
	// 	tester(3);
	// 	tester(4);
	// 	tester(5);
	// 	tester(9);
	// 	tester(7);
	// 	tester(8);
	

	// }






	}

	var clickHandler = function (d) {
		$scope.node = _.find($scope.nodes, function (n) { return n.index == d.index; });
		delete $scope.aggregatedGenerator;

		$scope.$apply();
	}

	var populateGenerators = function () {
		_.forEach($scope.challenge.generators, function (generator) {
			var generatorType = _.find(generatorTypeMap, function (gt) { return gt.abbreviation == generator.type || gt.display == generator.type; });
			
			generator.type = generatorType.display;
		})
	}
	var populateNodes = function () {
		// coming back from the evaluation page, no need to re-populate the challenge nodes list
		if (!$scope.challenge.nodes) {
			$scope.challenge.nodes = [];

			_.forEach($scope.challenge.demands, function (d) {
				var nodeInfo = _.find(nodeMap, function (n) { return n.index == d.node; });
				var name;

				if (nodeInfo) {
					name = nodeInfo.name;
				}

				var node = {
					index: d.node,
					name: name || 'Node ' + d.node,
					demands: {
						real: d.real,
						reactive: d.reactive
					},
					generators: []
				}

				$scope.challenge.nodes.push(node);
			})
		}

		$scope.node = _.find($scope.challenge.nodes, function (n) { return n.index == 0; });
	}

	var processNodeRealReactiveDemands = function () {
		_.forEach($scope.challenge.nodes || [], function (n) {
			var realDemands = n.demands.real;
			var reactiveDemands = n.demands.reactive;

			var head = _.head(realDemands);
			if (typeof head == 'number') {
				n.demands.real = multiplexArray(realDemands);
				n.demands.reactive = multiplexArray(reactiveDemands);
			}
		});
	}
	var visualizeNodeRealReactivePowerDemands = function () {
		var realDemandsContainer = '#node-real-demands';
		var reactiveDemandsContainer = '#node-reactive-demands';

		var ZERO_VALUE = [0, 0, 0, 0, 0, 0];
		var realDemandsData = ($scope.node && $scope.node.demands && $scope.node.demands.real) ? $scope.node.demands.real : ZERO_VALUE;
		var reactiveDemandsData = ($scope.node && $scope.node.demands && $scope.node.demands.reactive) ? $scope.node.demands.reactive : ZERO_VALUE;

		drawLineChart({ container: realDemandsContainer, series: 1, data: [realDemandsData] });
		drawLineChart({ container: reactiveDemandsContainer, series: 1, data: [reactiveDemandsData] });
	}

	$scope.viewGeneratorInfo = function (generator) {
		var _generatorProfileTitle = $('#generator-profile-modal .modal-title');
		var _generatorProfileDescription = $('#generator-profile-modal .modal-description');

		_generatorProfileTitle.text(generator.type);
		// _generatorProfileDescription.children().remove();

		_.forEach(generator, function (v, k) {
			var _entry = $('div[data-key="' + k + '"]');
			var _valueContainer = _entry.find('span').last();

			if (k == 'real_capacity') {
				var _svg = _valueContainer.find('svg');

				v = multiplexArray(v);

				drawLineChart({ container: '#generator-profile-real-capacity', series: 1, data: [v] });
			} else if (k == 'reactive_capacity') {
				var _svg = _valueContainer.find('svg');

				v = multiplexArray(v);

				drawLineChart({ container: '#generator-profile-reactive-capacity', series: 1, data: [v] });
			} else if (k == 'real_cost') {
				var _svg = _valueContainer.find('svg');

				v = parsePolynomial(v);

				drawLineChart({ container: '#generator-profile-real-cost', series: 1, data: [v] });
			} else if (k == 'per_node_limit') {
				_valueContainer.text(v);
			} else {
				_valueContainer.text(v);
			}
		})
	}
	$scope.addGenerator = function (generator) {
		if (generator.count == 0) {
			showWarning('No more generator of type ' + generator.type + ' available');
			return;
		}

		var targetBin = _.find($scope.node.generators, function (g) { return g.type == generator.type; });
		var count = targetBin ? targetBin.count + 1 : 1;

		if (count > generator.per_node_limit[$scope.node.index]) {
			showWarning('Generator count for ' + $scope.node.name + ' exceeds maximum node capacity');
			return;
		}

		if (targetBin) {
			targetBin.count++;
		} else {
			$scope.node.generators.push(_.merge(_.cloneDeep(generator), { count: 1 }));
		}

		generator.count--;
	}
	$scope.removeGenerator = function (generator) {
		var targetBin = _.find($scope.challenge.generators, function (g) { return g.type == generator.type; });
		targetBin.count++;

		if (generator.count > 1) {
			generator.count--;
		} else {
			_.remove($scope.node.generators, function (g) { return g.type == generator.type; });
		}
	}

	populateGenerators();
	populateNodes();

	processNodeRealReactiveDemands();
	visualizeNodeRealReactivePowerDemands();

	$timeout(function () { $scope.$apply(); });
}]

app.directive('evaluationDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './Partials/_Evaluation.html',
		scope: {
			challenge: '=?',
			evaluation: '=?'
		},
		controller: evaluationDirectiveController
	}
})

var evaluationDirectiveController = ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
	$scope.tab = 'nodes';

	$scope.switchTab = function (evt) {
		if (evt && evt.currentTarget) {
			$scope.tab = evt.currentTarget.dataset.tab;

			if ($scope.tab == 'nodes') {
				$scope.node = _.find($scope.nodes, function (n) { return n.node == 0; });

				$timeout(function () {
					var _node = $('.nodes').find('[data-index="0"]');
					_node.addClass('active');
					_node.siblings().removeClass('active');

					renderNode($scope.node);
				})
			} else if ($scope.tab == 'lines') {
				$scope.line = _.find($scope.lines, function (l) { return l.from == 0 && l.to == 1; });

				$timeout(function () {
					var _line = $('.lines').find('[data-from="0"][data-to="1"]');
					_line.addClass('active');
					_line.siblings().removeClass('active');

					renderLine($scope.line);
				})
			}

			$(evt.currentTarget).addClass('active');
			$(evt.currentTarget).siblings().removeClass('active');
		}
	}

	$scope.switchNode = function (evt) {
		if (evt && evt.currentTarget) {
			var index = evt.currentTarget.dataset.index;

			$scope.node = _.find($scope.nodes, function (n) { return n.node == index; });

			$timeout(function () { renderNode($scope.node); });

			$(evt.currentTarget).addClass('active');
			$(evt.currentTarget).siblings().removeClass('active');
		}
	}
	$scope.switchLine = function (evt) {
		if (evt && evt.currentTarget) {
			var from = evt.currentTarget.dataset.from;
			var to = evt.currentTarget.dataset.to;

			$scope.line = _.find($scope.lines, function (l) { return l.from == from && l.to == to; });

			$timeout(function () { renderLine($scope.line); });

			$(evt.currentTarget).addClass('active');
			$(evt.currentTarget).siblings().removeClass('active');
		}
	}

	$scope.viewLeaderBoard = function () {
		showSpinner();

		$DataService.getLeaderBoard()
			.then(function (data) {
				hideSpinner();

				$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'leaderboard', challenge: $scope.challenge, evaluation: $scope.evaluation, leaderboard: data, teamname: $.cookie('teamname') || '' }); });
			}).catch(function (error) {
				console.log(error);
			})
	}

	$scope.goBack = function () {
		$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'grid', challenge: $scope.challenge }); });
	}

	var processNodes = function () {
		$scope.nodes = $scope.evaluation.nodes;
		$scope.node = _.find($scope.nodes, function (n) { return n.node == 0; });

		$timeout(function () { renderNode($scope.node); });
	}
	var renderNode = function (node) {
		var generatedRealPower = multiplexArray(node.generated.real);
		var generatedReactivePower = multiplexArray(node.generated.reactive);
		var suppliedRealPower = multiplexArray(node.supplied.real);
		var suppliedReactivePower = multiplexArray(node.supplied.reactive);

		drawLineChart({ container: '#node-evaluation-real-power-svg', data: [generatedRealPower, suppliedRealPower] });
		drawLineChart({ container: '#node-evaluation-reactive-power-svg', data: [generatedReactivePower, suppliedReactivePower] });
	}

	var processLines = function () {
		$scope.lines = $scope.evaluation.lines;
		$scope.line = _.find($scope.lines, function (l) { return l.from == 0 && l.to == 1; });

		// $timeout(function () { renderLine($scope.line); });
	}
	var renderLine = function (line) {
		var realPowerFlow = multiplexArray(line.real_power);
		var reactivePowerFlow = multiplexArray(line.reactive_power);

		drawLineChart({ container: '#line-evaluation-real-power-svg', data: [realPowerFlow] });
		drawLineChart({ container: '#line-evaluation-reactive-power-svg', data: [reactivePowerFlow] });
	}

	processNodes();
	processLines();

	var retrieveLeaderBoard = function () {
		return new Promise(function (resolve, reject) {
			showSpinner();

			$.ajax({
				url: 'http://127.0.0.1:5000/leaderboard/',
				type: 'GET',
				success: function (res) {
					hideSpinner();

					var data = JSON.parse(res);

					console.log(data);

					var res = {
						status: 'OK',
						leaderboard: data
					}

					resolve(res);
				},
				error: function (data) {
					console.log(data);
				}
			})
		})
	}
}]

app.directive('leaderBoardDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './Partials/_LeaderBoard.html',
		scope: {
			challenge: '=?',
			evaluation: '=?',
			leaderboard: '=?',
			teamname: '=?'
		},
		controller: leaderBoardDirectiveController
	}
})
var leaderBoardDirectiveController = ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {
	$scope.tab = 'environmental-footprint';

	$scope.switchTab = function (evt) {
		if (evt && evt.currentTarget) {
			$scope.tab = evt.currentTarget.dataset.tab;

			$(evt.currentTarget).addClass('active');
			$(evt.currentTarget).siblings().removeClass('active');
		}
	}

	$scope.goBack = function () {
		$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'evaluation', challenge: $scope.challenge, evaluation: $scope.evaluation }); });
	}

	var processLeaders = function () {
		_.forEach($scope.leaderboard, function (b, c) {
			switch(c) {
				case 'CO2':
					$scope.environmentalFootprintBoard = [];

					var i = 1;
					_.forEach(b, function (v, k) {
						var winner = { ranking: i, name: k, score: v };
						$scope.environmentalFootprintBoard.push(winner);

						i ++;
					})

					break;
				case 'cost':
					$scope.realCostBoard = [];

					var i = 1;
					_.forEach(b, function (v, k) {
						var winner = { ranking: i, name: k, score: v };
						$scope.realCostBoard.push(winner);

						i++;						
					})

					break;
				case 'installation_cost':
					$scope.installationCostBoard = [];

					var i = 1;
					_.forEach(b, function (v, k) {
						var winner = { ranking: i, name: k, score: v };
						$scope.installationCostBoard.push(winner);
					
						i++;
					})

					break;
					
			}
		})
	}

	processLeaders();
}]