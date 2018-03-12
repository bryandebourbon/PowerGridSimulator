app.service('LoginService', function () {
	var init = function (args) {
		// console.log('Login service initiated.');
	}

	var getChallenges = function (args) {
		var headers = { team_name: $.cookie('teamname') || '', challenge_id: 10 };
		
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

			firebase.auth().signInWithEmailAndPassword(user.email, user.password).catch(function (error) {
				_authErrorContainer.show();
				_firebaseAuthErrorHeader.show();
				_authErrorMessage.show();

				_authErrorMessage.text(error.message);

				return;
			});

			getChallenges(user)
				.then(function (data) {
					var res = {
						status: 'OK',
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