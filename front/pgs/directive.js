app.directive('loginDirective', function () {
	return {
		restrict: 'EA',
		templateUrl: './Partials/_Login.html',
		scope: {
			email: '@',
			password: '@',
		},
		controller: loginDirectiveController
	}
})
var loginDirectiveController = ['$scope', '$rootScope', 'DataService', function ($scope, $rootScope, $DataService) {
	$scope.email = '';
	$scope.password = '';

	$scope.register = function () {
		var user = { email: $scope.email || '', password: $scope.password || ''};

		if (!_.isNull(user.email) && user.email.length < 1) {
			showWarning('Email field cannot be empty.');

			return;
		}
		if (!_.isNull(user.password) && user.password.length < 5) {
			showWarning('Password field should be at least 6 characters.');

			return;
		}

		firebase.auth().createUserWithEmailAndPassword(user.email, user.password)
			.then(function (firebaseUser) {
				var _teamManagementModal = $('#team-management-modal');
				var _collectTeamname = $('#collect-team-name');

				var _collectTeamSecretCode = $('#collect-team-secret-code');
				var _distributeTeamSecretCode = $('#distribute-team-secret-code');
				
				var _teamnameInput = $('#team-name-input');
				var _secretCodeInput = $('#secret-code-input');

				var _submitTeamname = $('#submit-team-name');
				var _submitSecretCode = $('#submit-secret-code');

				_collectTeamname.show();
				_collectTeamSecretCode.hide();
				_distributeTeamSecretCode.hide();

				_submitTeamname.show();
				_submitSecretCode.hide();

				_teamnameInput.val('');
				_secretCodeInput.val('');

				_teamManagementModal.modal('show');
				_submitTeamname.on('click', function (evt) {
					var teamname = _teamnameInput.val();

					var teams = firebase.database().ref().child('teams');
					teams.orderByChild('team_name').equalTo(teamname).once('value', function (team) {
						var data = team.val();

						if (data) {
							_collectTeamname.hide();
							_collectTeamSecretCode.show();

							_submitTeamname.hide();
							_submitSecretCode.show();

							_teamnameInput.val('');
							_secretCodeInput.val('');

							var secretCode = _.keys(data)[0];
							
							_submitSecretCode.on('click', function (evt) {
								var inputCode = _secretCodeInput.val();

								if (inputCode == secretCode) {
									$('#team-management-modal').modal('hide');

									showSpinner();

									firebaseUser.updateProfile({
										displayName: teamname
									}).then(function () {

										$DataService.getChallenges({ teamname: teamname })
											.then(function (data) {
												hideSpinner();

												$.cookie('teamname', teamname);
												$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: data });
											}).catch(function (error) {
												hideSpinner();

												showWarning(error);
											})
									}).catch(function (error) {
										hideSpinner();

										showWarning(error.message);
									})
								}
							})
						} else {
							var secretCode = teams.push().key;

							var _secretCode = $('.pgs-secret-code');

							_collectTeamname.hide();
							_distributeTeamSecretCode.show();

							_submitTeamname.hide();
							_submitSecretCode.hide();

							_teamnameInput.val('');
							_secretCodeInput.val('');
							_secretCode.val(secretCode);

							_teamManagementModal.on('hide.bs.modal', function (evt) {
								showSpinner();

								teams.orderByChild('team_id').limitToLast(1).once('value', function (teamData) {
									var teamID = _.head(_.values(teamData.val())).team_id + 1;

									var newTeam = {};
									newTeam[secretCode] = { team_id: teamID, team_name: teamname };

									teams.update(newTeam);

									$DataService.getChallenges({ teamname: teamname })
										.then(function (data) {
											hideSpinner();

											$.cookie('teamname', teamname);
											$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: data });
										}).catch(function (error) {
											hideSpinner();

											showWarning(error);
										})
								}).catch(function (error) {
									hideSpinner();

									showWarning(error);
								})
							})
						}
					})
				})
			}).catch(function (error) {
				showWarning(error.message);
			})
	}
	$scope.login = function () {
		var user = { email: $scope.email || '', password: $scope.password || '' };

		if (!_.isNull(user.email) && user.email.length < 1) {
			showWarning('Email field should not be empty.');

			return;
		}
		if (!_.isNull(user.password) && user.password.length < 1) {
			showWarning('Password field should not be empty.');

			return;
		}

		firebase.auth().signInWithEmailAndPassword(user.email, user.password).then(function (data) {
			var teamname = data.displayName;

			showSpinner();

			$DataService.getChallenges({ teamname: data.displayName })
				.then(function (data) {
					hideSpinner();

					$.cookie('teamname', teamname);
					$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: data });
				}).catch(function (error) {
					hideSpinner();

					showWarning(error);
				})
		}).catch(function (error) {
			showWarning(error);

			return;
		});
	}

	$scope.copySecretCode = function () {
		var _secretCode = $('#pgs-secret-code');
	
		_secretCode.select();

		document.execCommand('Copy');
		document.getSelection().removeAllRanges();
	}

	var _teamname = $('#team-name').hide();
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
var challengesDirectiveController = ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
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
			$DataService.getChallenge({ teamname: $.cookie('teamname'), challengeID: id })
				.then(function (data) {
					hideSpinner();

					$rootScope.$broadcast('pgsStateChanged', { state: 'grid', challenge: data });
				}).catch(function (error) {
					hideSpinner();

					showWarning(error);
				})
		}
	}

	$scope.goBack = function () {
		$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
	}
	$scope.logOut = function () {
		$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
	}
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

	$scope.viewLeaderBoard = function () {
		showSpinner();

		$DataService.getLeaderBoard({ teamname: $.cookie('teamname'), challengeID: $scope.challenge.id })
			.then(function (data) {
				hideSpinner();

				$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'leaderboard', challenge: $scope.challenge, leaderboard: data, teamname: $.cookie('teamname') || '' }); });
			}).catch(function (error) {
				console.log(error);
			})
	}
	
	$scope.goBack = function () {
		showSpinner();

		$DataService.getChallenges({ teamname: $.cookie('teamname') })
			.then(function (data) {
				hideSpinner();

				$rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: data });
			}).catch(function (error) {
				console.log(error);
			})
	}
	$scope.logOut = function () {
		$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
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
	$scope.renderMap = function () {
		Vis.render($scope);
	}

	var populateGenerators = function () {
		_.forEach($scope.challenge.generators, function (generator) {
			var generatorType = _.find(generatorTypeMap, function (gt) { return gt.abbreviation == generator.type || gt.display == generator.type; });
			
			generator.type = generatorType.display;
		})

		$timeout(function () {
			_.forEach($scope.challenge.generators, function (g, i) {
				if (g.count == 0) {
					var _generatorAddButton = $('.pgs-add-button:eq(' + i + ')');
					_generatorAddButton.addClass('disabled pgs-disabled');	// this is a hacky fix, ng-disabled not working here
				}
			})
		})
	}
	var populateNodes = function () {
		$scope.challenge.nodes = [];

		_.forEach($scope.challenge.demands, function (d) {
			var nodeInfo = _.find(nodeMap, function (n) { return n.index == d.node; });
			var name;

			if (nodeInfo) {
				name = nodeInfo.name;
			}

			var node = {
				index: d.node,
				name: name,
				demands: {
					real: d.real,
					reactive: d.reactive
				},
				generators: []
			}

			$scope.challenge.nodes.push(node);
		})

		if (_.size($scope.challenge.saved_challenge) != 0) {
			_.forEach($scope.challenge.saved_challenge, function (generators, i) {
				var node = _.find($scope.challenge.nodes, function (n) { return n.index == i; });
				
				_.forEach(generators, function (count, typeAbbriviation) {
					var generatorType = _.find(generatorTypeMap, function (g) { return g.abbreviation == typeAbbriviation; });
					if (generatorType) {
						var type = generatorType.display;
					}

					var generator = _.find(node.generators, function (g) { return g.type == type || ''; });

					if (generator) {
						generator.count ++;
					} else {
						var generatorCopy = _.cloneDeep(_.find($scope.challenge.generators, function(g) { return g.type == type; }));
						generatorCopy.count = 1;

						node.generators.push(generatorCopy);
					}

					var inventoryGenerator = _.find($scope.challenge.generators, function (g) { return g.type == type; });
					if (inventoryGenerator) {
						inventoryGenerator.count --;
					}
				})
			})
		}	
		
		$scope.node = _.head($scope.challenge.nodes);
	}
	var populateLines = function () {
		_.forEach($scope.challenge.lines, function (l) {
			var fromRegion = _.find(nodeMap, function (n) { return n.index == l.from; }) ? _.find(nodeMap, function (n) { return n.index == l.from; }).name : '';
			var toRegion = _.find(nodeMap, function (n) { return n.index == l.to; }) ? _.find(nodeMap, function (n) { return n.index == l.to; }).name : '';
			var name = fromRegion + ' - ' + toRegion;

			l.fromRegion = fromRegion;
			l.toRegion = toRegion;
			l.name = name;
		})

		$scope.line = _.head($scope.challenge.lines);
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
	
		drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: realDemandsContainer, data: [realDemandsData] });
		drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: reactiveDemandsContainer, data: [reactiveDemandsData] });
	}

	$scope.viewGeneratorInfo = function (generator) {
		var _generatorProfileTitle = $('#generator-profile-modal .modal-title');
		var _generatorProfileDescription = $('#generator-profile-modal .modal-description');

		_generatorProfileTitle.text(generator.type);

		_.forEach(generator, function (v, k) {
			var _entry = $('div[data-key="' + k + '"]');
			var _valueContainer = _entry.find('span').last();

			if (k == 'real_capacity') {
				var _svg = _valueContainer.find('svg');

				v = multiplexArray(v);

				drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#generator-profile-real-capacity', data: [v] });
			} else if (k == 'reactive_capacity') {
				var _svg = _valueContainer.find('svg');

				v = multiplexArray(v);

				drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#generator-profile-reactive-capacity', data: [v] });
			} else if (k == 'real_cost') {
				var _svg = _valueContainer.find('svg');

				v = parsePolynomial(v);

				drawLineChart({ type: 'polynomial', unit: 'Dollars (k)', container: '#generator-profile-real-cost', data: [v] });
			} else if (k == 'per_node_limit') {
				_valueContainer.text(v);
			} else if (k == 'installation_cost') {
				_valueContainer.text('$ ' + (v == 0 ? 0 : (v / 1000).toFixed(2)) + ' M');
			} else if (k == 'unit_CO2') {
				_valueContainer.text((v / 1000).toFixed(2) + ' T');
			} 
		})

		var _nonDispatchableInfo = $('.non-dispatchable');
		var _dispatchableInfo = $('.dispatchable');
		var _hydroOnlyInfo = $('.hydro-only');
		
		if (_.include(['Nuclear', 'Solar', 'Wind'], generator.type)) {
			_nonDispatchableInfo.show();
			_dispatchableInfo.hide();
			_hydroOnlyInfo.hide();
		} else if (generator.type == 'Gas') {
			_nonDispatchableInfo.hide();
			_dispatchableInfo.show();
			_hydroOnlyInfo.hide();
		} else if (generator.type == 'Hydro') {
			_nonDispatchableInfo.hide();
			_dispatchableInfo.show();
			_hydroOnlyInfo.show();
		}
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

	$scope.$watch('target', function (newVal, oldVal) {
		if (newVal == 'node') {
			$timeout(function () { $('.pgs-add-button').attr('disabled', false); });
		} else if (newVal == 'line') {
			$timeout(function () { $('.pgs-add-button').attr('disabled', true); });
		}
	})

	$scope.handleClick = function (args) {
		if (args.type == 'node') {
			$scope.node = _.find($scope.challenge.nodes, function (n) { return n.index == args.index; });
			visualizeNodeRealReactivePowerDemands();

			$scope.target = 'node';
			$timeout(function () { $scope.$apply(); });
		} else if (args.type == 'line') {
			$scope.line = _.find($scope.challenge.lines, function (l) { return l.from == args.source && l.to == args.target; });

			$scope.target = 'line';
			$timeout(function () { $scope.$apply(); });
		} else {
			$scope.target = null;
			$timeout(function () { $scope.$apply(); });
		}
	}
	$scope.handleDrag = function (args) {
		var generator = _.find($scope.challenge.generators, function (g) { return g.type == args.type; });

		if (generator && generator.count > 0) {
				generator.count--;
				generator._selected = true;
		}

		$timeout(function () { $scope.$apply(); });
	}
	$scope.revertDrag = function (args) {
		var generator = _.find($scope.challenge.generators, function (g) { return g.type == args.type; });

		if (generator && generator._selected) {
			generator.count ++;
			delete generator._selected;
		}

		$timeout(function () { $scope.$apply(); });
	}
	$scope.handleDrop = function (args) {
		var target = _.find($scope.challenge.nodes, function (n) { return n.index == args.target; });

		if (target) {
			var targetBin = _.find(target.generators, function (g) { return g.type == args.type; });

			if (targetBin) {
				targetBin.count ++;
			} else {
				var generator = _.find($scope.challenge.generators, function (g) { return g.type == args.type; });

				target.generators.push(_.merge(_.cloneDeep(generator), { count: 1 }));
			}
		}

		$timeout(function () { $scope.$apply(); });
	}

	populateGenerators();
	populateNodes();
	populateLines();

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

		$DataService.getLeaderBoard({ teamname: $.cookie('teamname'), challengeID: $scope.challenge.id })
			.then(function (data) {
				hideSpinner();

				$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'leaderboard', challenge: $scope.challenge, evaluation: $scope.evaluation, leaderboard: data, teamname: $.cookie('teamname') || '' }); });
			}).catch(function (error) {
				console.log(error);
			})
	}

	$scope.goBack = function () {
		showSpinner();

		$DataService.getChallenge({ teamname: $.cookie('teamname'), challengeID: $scope.challenge.id })
			.then(function (data) {
				hideSpinner();

				$rootScope.$broadcast('pgsStateChanged', { state: 'grid', challenge: data });
			}).catch(function (error) {
				console.log(error);
			})
	}
	$scope.logOut = function () {
		$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
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

		drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#node-evaluation-real-power-svg', data: [generatedRealPower, suppliedRealPower] });
		drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#node-evaluation-reactive-power-svg', data: [generatedReactivePower, suppliedReactivePower] });
	}

	var processLines = function () {
		$scope.lines = $scope.evaluation.lines;
		$scope.line = _.find($scope.lines, function (l) { return l.from == 0 && l.to == 1; });

		// $timeout(function () { renderLine($scope.line); });
	}
	var renderLine = function (line) {
		var realPowerFlow = multiplexArray(line.real_power);
		var reactivePowerFlow = multiplexArray(line.reactive_power);
		var capacity = multiplexArray([line.capacity]);

		drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#line-evaluation-real-power-svg', data: [realPowerFlow, capacity] });
		drawLineChart({ type: 'simulation', unit: 'Power (100 MW)', container: '#line-evaluation-reactive-power-svg', data: [reactivePowerFlow, capacity] });
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
var leaderBoardDirectiveController = ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
	$scope.tab = 'environmental-footprint';

	$scope.switchTab = function (evt) {
		if (evt && evt.currentTarget) {
			$scope.tab = evt.currentTarget.dataset.tab;

			$(evt.currentTarget).addClass('active');
			$(evt.currentTarget).siblings().removeClass('active');
		}
	}

	$scope.goBack = function () {
		if ($scope.evaluation) {
			$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'evaluation', challenge: $scope.challenge, evaluation: $scope.evaluation }); });
		} else {
			$DataService.getChallenge({ teamname: $.cookie('teamname'), challengeID: $scope.challenge.id })
				.then(function (data) {
					hideSpinner();

					$rootScope.$broadcast('pgsStateChanged', { state: 'grid', challenge: data });
				}).catch(function (error) {
					hideSpinner();

					showWarning(error);
				})		}
	}
	$scope.logOut = function () {
		$timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
	}

	var processLeaders = function () {
		_.forEach($scope.leaderboard, function (b, c) {
			switch(c) {
				case 'CO2':
					$scope.environmentalFootprintBoard = [];

					var i = 1;
					_.forEach(b, function (v, k) {
						var winner = { name: k, score: (Math.round(v * 100) / 100).toFixed(2) };
						$scope.environmentalFootprintBoard.push(winner);

						i ++;
					})

					$scope.environmentalFootprintBoard = _.sortBy($scope.environmentalFootprintBoard, function (w) { return w.score; });
					_.forEach($scope.environmentalFootprintBoard, function (w, i) {
						w.ranking = i + 1;
					})

					break;
				case 'cost':
					$scope.realCostBoard = [];

					var i = 1;
					_.forEach(b, function (v, k) {
						var winner = { name: k, score: (Math.round(v * 100) / 100).toFixed(2) };
						$scope.realCostBoard.push(winner);

						i++;						
					})

					$scope.realCostBoard = _.sortBy($scope.realCostBoard, function (w) { return w.score; });
					_.forEach($scope.realCostBoard, function (w, i) {
						w.ranking = i + 1;
					})

					break;
				case 'installation_cost':
					$scope.installationCostBoard = [];

					var i = 1;
					_.forEach(b, function (v, k) {
						var winner = { name: k, score: (Math.round(v * 100) / 100).toFixed(2) };
						$scope.installationCostBoard.push(winner);
					
						i++;
					})

					$scope.installationCostBoard = _.sortBy($scope.installationCostBoard, function (w) { return w.score; });
					_.forEach($scope.installationCostBoard, function (w, i) {
						w.ranking = i + 1;
					})

					break;
					
			}
		})
	}

	processLeaders();
}]
