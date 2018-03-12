app.service('LoginService', function () {
	var init = function (args) {
		// console.log('Login service initiated.');
	}

	var getChallenges = function (args) {
		var headers = {"team_name": 'ourteam', "challenge_id": 10 };
		
		return new Promise(function (resolve, reject) {
			showSpinner();

			$.ajax({
				url: 'http://127.0.0.1:5000/getChallenge/',
				type: 'GET',
				// (TODO Annie) the challenge ID and team ID are fake. Please present the real ones.
				headers: headers,
				success: function (data) {
					if (data) {
						hideSpinner();

						var challenge = JSON.parse(data);

						resolve([challenge]);
					}
				},
				error: function (data) {
					console.log(data);
				}
			})
		})
	}

	var register = function (args) {
		return new Promise(function (resolve, reject) {
			var user = {
				email: args.email || '',
				password: args.password || '',
				teamname: args.teamname || '',

				// (TODO Annie) these are dummy data
				team_id: 1,
				challenge_id: 10
			}

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

										getChallenges(user)
											.then(function (data) {
												var res = {
													status: 'OK',
													uid: guid(),
													challenges: data
												}

												resolve(res);
											}).catch(function (error) {
												reject(error);
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
										'team_id': teamID.toString(),
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
										getChallenges(user)
											.then(function (data) {
												var res = {
													status: 'OK',
													uid: guid(),
													challenges: data
												}

												resolve(res);
											}).catch(function (error) {
												reject(error);
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
		})
	}

	var login = function (args) {
		return new Promise(function (resolve, reject) {
			var user = {
				email: args.email || '',
				password: args.password || '',
				teamname: args.teamname || '',

				// (TODO Annie) these are dummy data
				team_id: 1,
				challenge_id: 10
			}

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
			});

			getChallenges(user)
				.then(function (data) {
					var res = {
						status: 'OK',
						uid: guid(),
						challenges: data
					}

					resolve(res);
				}).catch(function (error) {
					reject(error);
				})
		})
	}

	this.init = function (args) { return init(args); };
	this.register = function (args) { return register(args); }
	this.login = function (args) { return login(args); }
})

app.service('ChallengesService', function () {
	var _challenges = [];

	var init = function (args) {
		_challenges = args.challenges;
	}

	var previewChallenge = function (id) {
		var challenge = _.find(_challenges, function (c) { return c.id == id; });

		if (challenge) {
			var _previewModalTitle = $('.modal-title');
			var _previewModalDescription = $('.modal-description');

			_previewModalTitle.text(challenge.name);
			_previewModalDescription.text(challenge.description || 'This is some description of this challenge');
		}
	}

	var simulateChallenge = function (id) {
		var challenge = _.find(_challenges, function (c) { return c.id == id; });

		if (challenge) {
			return {
				status: 'OK',
				challenge: challenge
			}
		}
	}

	this.init = function (args) { return init(args); }
	this.previewChallenge = function (id) { return previewChallenge(id); }
	this.simulateChallenge = function (id) { return simulateChallenge(id); }
})

app.service('ChallengeService', function () {
	var _challenge = null;

	var init = function (args) {
		_challenge = args.challenge;
	}

	var submitChallenge = function (challenge) {
		return new Promise(function (resolve, reject) {
			// var submission = JSON.stringify([	{ 'node': 0, 'generators': {} },
			// 					{ 'node': 1, 'generators': { 'H': 1 } },
			// 					{ 'node': 2, 'generators': { 'N': 1 } },
			// 					{ 'node': 3, 'generators': { 'G': 1 } },
			// 					{ 'node': 4, 'generators': { 'S': 1 } },
			// 					{ 'node': 5, 'generators': { 'W': 1 } },
			// 					{ 'node': 6, 'generators': { 'H': 1, 'N': 1 } },
			// 					{ 'node': 7, 'generators': { 'G': 1, 'S': 1 } },
			// 					{ 'node': 8, 'generators': { 'G': 1, 'S': 1, 'W': 1 } },
			// 					{ 'node': 9, 'generators': { 'H': 1, 'N': 1, 'G': 1, 'S': 1, 'W': 1 } }]);

			var minifiChallenge = function (challenge) {
				var generatorTypeMap = [{ abbreviation: 'G', display: 'Gas' },
				{ abbreviation: 'H', display: 'Hydro' },
				{ abbreviation: 'N', display: 'Nuclear' },
				{ abbreviation: 'S', display: 'Solar' },
				{ abbreviation: 'W', display: 'Water' }];

				var mChallenge = [];
				_.forEach(challenge.nodes, function (n) {
					var node = {
						node: n.index,
						generators: {}
					};

					_.forEach(n.generators, function (g) {
						var generatorType = _.find(generatorTypeMap, function (gt) { return gt.display == g.type; });

						if (generatorType) {
							node.generators[generatorType.abbreviation] = g.count;
						}
					})

					mChallenge.push(node);
				})

				return JSON.stringify(mChallenge);
			}

			var submission = minifiChallenge(challenge);
			var headers = { team_name: 'ourteam', challenge_id: 10 };

			showSpinner();

			$.ajax({
				url: 'http://127.0.0.1:5000/submit/',
				type: 'POST',
				headers: headers,
				data: submission,
				success: function (res) {
					hideSpinner();

					var data = JSON.parse(res);

					if (data.success) {
						var evaluation = data.eval;

						var res = {
							status: 'OK',
							evaluation: evaluation
						}

						resolve(res);
					} else {
						var res = {
							status: 'ERROR',
							error: data.message
						}

						resolve(res);
					}
				},
				error: function (data) {
					console.log(data);
				}
			})
		})
	}

	this.init = function (args) { return init(args); }
	this.submitChallenge = function (challenge) { return submitChallenge(challenge); }
})

app.service('SimulatorService', function () {
	var init = function () {
		// console.log('Simulator service initiated.');
	}

	this.init = function () { return init(); };
})

app.service('EvaluationService', function () {
	var init = function (args) {
		// console.log('Evaluation service initiated.');
	}

	this.init = function (args) { return init(args); }
})

app.service('LeaderBoardService', function () {
	var init = function () {
		// console.log('Leader board service initiated.');
	}

	var retrieveLeaderBoard = function () {
		return new Promise(function (resolve, reject) {
			$.ajax({
				url: 'http://127.0.0.1:5000/leaderboard/',
				type: 'GET',
				success: function (res) {
					hideSpinner();

					var data = JSON.parse(res);

					console.log(data);

					var res = {
						status: 'OK',
						leaderBoard: data
					}

					resolve(res);
				},
				error: function (data) {
					console.log(data);
				}
			})
		})
	}

	this.init = function (args) { return init(args); }
	this.retrieveLeaderBoard = function () { return retrieveLeaderBoard(); }
})