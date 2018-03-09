app.service('LoginService', function () {
	var init = function (args) {
		// console.log('Login service initiated.');
	}

	var getChallenges = function (args) {
		return new Promise(function (resolve, reject) {
			$.ajax({
				url: 'http://127.0.0.1:5000/getChallenge',
				type: 'GET',
				success: function (data) {
					if (data) {
						var challenge = JSON.parse(data);

						resolve([challenge]);
					}
				},
			})
		})
	}
	
	var register = function (args) {
		return new Promise(function (resolve, reject) {
			var user = {
				email: args.email || '',
				password: args.password || '',
				teamname: args.teamname || ''
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
				.then(function(firebaseUser) {
					firebaseUser.updateProfile ({
						displayName: user.teamname
					}).then(function() {
						// Authenticate team.
						var teamsRef = firebase.database().ref().child('teams');
						teamsRef.orderByChild('team_name').equalTo(user.teamname).once('value',team => {
							const teamData = team.val();
							if (teamData) {
								// Else enter code and check.
								// TODO(Annie): show text box of 'Please enter team secret code'
								var inputCode = 'a';
								teamKey = Object.keys(teamData)[0];
								if (inputCode != teamKey) {
									_authErrorMessage.show();
									var errorMessage = 'Wrong team secret code.';
									_authErrorMessage.text(errorMessage);
								}
							} else {
								// team doesn't exist, push to teams/ db.
								var teamKey = teamsRef.push().key;
								teamsRef.orderByChild('team_id').limitToLast(1).once('value',lastTeam => {
									const lastTeamData = Object.values(lastTeam.val())[0];
									var teamID = 1 + +lastTeamData.team_id;
									var newTeam = {};
									newTeam[teamKey] = {
										'team_id': teamID,
										'team_name': user.teamname
									};
									teamsRef.update(newTeam);

									// TODO(Annie): page redirects to challenges after creating, cannot show this code.
									_teamCodeMessage.show();
									var codeMessage = 'The secret code for your team is: ' + teamKey;
									_teamCodeMessage.text(codeMessage);
								});
							}
							
							getChallenges(user);
						});

					}, function(error) {
						console.log('could not update your team');
					});
				}, function (error) {
					_authErrorContainer.show();
					_firebaseAuthErrorHeader.show();
					_authErrorMessage.show();

					_authErrorMessage.text(error.message);
				})

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

	var login = function (args) {
		return new Promise (function (resolve, reject) {
			var user = {
				email: args.email || '',
				password: args.password || '',
				teamname: args.teamname || ''
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

			firebase.auth().signInWithEmailAndPassword(user.email, user.password).catch(function(error) {
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
			var submission = JSON.stringify([	{ 'node': 0, 'generators': {} },
								{ 'node': 1, 'generators': { 'H': 1 } },
								{ 'node': 2, 'generators': { 'N': 1 } },
								{ 'node': 3, 'generators': { 'G': 1 } },
								{ 'node': 4, 'generators': { 'S': 1 } },
								{ 'node': 5, 'generators': { 'W': 1 } },
								{ 'node': 6, 'generators': { 'H': 1, 'N': 1 } },
								{ 'node': 7, 'generators': { 'G': 1, 'S': 1 } },
								{ 'node': 8, 'generators': { 'G': 1, 'S': 1, 'W': 1 } },
								{ 'node': 9, 'generators': { 'H': 1, 'N': 1, 'G': 1, 'S': 1, 'W': 1 } }]);

			$.ajax({
				url: 'http://127.0.0.1:5000/submit/',
				type: 'POST',
				headers: { username: 'ourteam' },
				data: submission,
				success: function (res) {
					var data = JSON.parse(res);
					var evaluation = data.eval;
					
					var res = {
						status: 'OK',
						evaluation: evaluation
					}

					resolve(res);
				},
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

	this.init = init;
})