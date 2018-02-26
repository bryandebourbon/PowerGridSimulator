app.service('LoginService', function () {
	var init = function (args) {
		// console.log('Login service initiated.');
	}

	var register = function (username, password, teamname) {
		var user = {
			username: username,
			password: password,
			teamname: teamname
		}
		if (username.length < 4) {
			alert('Please enter an email address.');
			return;
		}
		if (password.length < 4) {
			alert('Please enter a password.');
			return;
		}

		// Sign in with email and pass.
		firebase.auth().createUserWithEmailAndPassword(username, password).then(
			function(user) {
				user.updateProfile({
				 displayName: teamname
				}).then(function() {
					// TODO(Mel): authenticate team
				}, function(error) {
				 console.log('could not update your team');
				});
			}, function(error) {
				if (errorCode == 'auth/weak-password') {
				 alert('The password is too weak.');
				} else {
				 console.error(error);
				}
		});

		// console.log('User registered.');
		var challenges = [	{ guid: guid(), cid: 1, level: 1, name: 'Ontario - Constant Power', saved: true, description: 'This is the first testing power case challenge.' },
							{ guid: guid(), cid: 3, level: 2, name: 'Ontario - Simple Power', saved: false, description: 'This is the second testing power case challenge.' },
							{ guid: guid(), cid: 4, level: 3, name: 'Ontario - Reactive Power', saved: false, description: 'This is the third testing power case challenge.' }];
		var res = {
			status: 'OK',
			uid: guid(),
			challenges: challenges
		}

		return res;
	}

	var login = function (username, password, teamname) {
		var user = {
			username: username,
			password: password,
			teamname: teamname
		}
		firebase.auth().signInWithEmailAndPassword(username, password).catch(function(error) {
			var errorCode = error.code;
			if (errorCode === 'auth/wrong-password') {
			  alert('Wrong password.');
			}
		});

		// console.log('Login successful.');
		var challenges = [	{ guid: guid(), cid: 1, level: 1, name: 'Ontario - Constant Power', saved: true, description: 'This is the first testing power case challenge.' },
							{ guid: guid(), cid: 3, level: 2, name: 'Ontario - Simple Power', saved: false, description: 'This is the second testing power case challenge.' },
							{ guid: guid(), cid: 4, level: 3, name: 'Ontario - Reactive Power', saved: false, description: 'This is the third testing power case challenge.' }];
		var res = {
			status: 'OK',
			uid: guid(),
			challenges: challenges
		}

		return res;
	}

	this.init = function (args) { return init(args); };
	this.register = function (username, password, teamnname) { return register(username, password, teamname); }
	this.login = function (username, password) { return login(username, password); }
})

app.service('ChallengesService', function () {
	var _uid = null;
	var _challenges = [];

	var init = function (args) {
		// console.log('Challenges service initiated.');

		_uid = args.uid;
		_challenges = args.challenges;
	}

	var previewChallenge = function (cid) {
		// console.log('Preview challenge ' + cid);

		var challenge = _.find(_challenges, function (c) { return c.cid == cid; });

		if (challenge) {
			alert(challenge.description);
		}
	}

	var simulateChallenge = function (cid) {
		// console.log('Simulate challenge ' + cid);

		var challenge = _.find(_challenges, function (c) { return c.cid == cid; });

		if (challenge) {
			var info = {
				uid: _uid,
				cid: cid
			}

			fakeAPI('getChallenge', info);

			var fakeFactory = function () {
				var fakeGenerator = function () {
					var types = ['solar', 'hydro', 'nuclear'];
					var capacities = [1, 2, 3, 4, 5];

					var random1 = Math.floor(Math.random() * 100) % 3;
					var random2 = Math.floor(Math.random() * 100) % 5;

					var generator = {
						guid: guid(),
						type: types[random1],
						capacity: capacities[random2]
					}

					return generator;
				}
				var fakeGenerators = function (n) {
					var generators = [];

					_.forEach(_.range(0, n), function (i) {
						var generator = fakeGenerator();
						generators.push(generator);
					})

					return generators;
				}

				var fakeDemand = function () {
					var demand = [];

					_.forEach(_.range(0, 24), function (i) {
						var random = Math.floor(Math.random() * 100) % 25;
						var hourlyDemand = {
							hour: i,
							demand: random
						}

						demand.push(hourlyDemand);
					})

					return demand;
				}
				var fakeNode = function (index) {
					var demand = fakeDemand();
					var generators = fakeGenerators(3);

					var node = {
						index: index,
						name: 'Node ' + index,
						demand: demand,
						generators: generators
					}

					return node;
				}
				var fakeNodes = function (n) {
					var nodes = [];

					_.forEach(_.range(0, 10), function (i) {
						var node = fakeNode(i);

						nodes.push(node);
					})

					return nodes;
				}

				var fakeLink = function () {
					var source = Math.floor(Math.random() * 100) % 10;
					var target = Math.floor(Math.random() * 100) % 10;

					while (source == target) {
						target = Math.floor(Math.random() * 100) % 10;
					}

					var capacities = [2, 3, 4, 5, 6, 7];
					var random = Math.floor(Math.random() * 100) % 6;
					var capacity = capacities[random];

					var link = {
						source: source,
						target: target,
						capacity: capacity
					}

					return link;
				}
				var fakeLinks = function (n) {
					var links = [];

					_.forEach(_.range(0, n), function (i) {
						var link = fakeLink();

						links.push(link);
					})

					return links;
				}

				var functions = {
					generator: function () { return fakeGenerator(); },
					generators: function (n) { return fakeGenerators(n); },
					demand: function () { return fakeDemand(); },
					node: function (index) { return fakeNode(index); },
					nodes: function (n) { return fakeNodes(n); },
					link: function () { return fakeLink(); },
					links: function (n) { return fakeLinks(n); }
				}

				return functions;
			}
			
			var fake = fakeFactory();
			var challenge = { 
				guid: guid(), 
				cid: 3, 
				level: 2, 
				name: 'Ontario - Simple Power', 
				saved: false, 
				description: 'This is the second testing power case challenge.',
				inventory: fake.generators(14),
				nodes: fake.nodes(10),
				links: fake.links(15)
			}

			return {
				status: 'OK',
				challenge: challenge
			}
		}
	}

	this.init = function (args) { return init(args); }
	this.previewChallenge = function (cid) { return previewChallenge(cid); }
	this.simulateChallenge = function (cid) { return simulateChallenge(cid); }
})

app.service('ChallengeService', function () {
	var _challenge = null;
	
	var init = function (args) {
		// console.log('Challenge service initiated.');

		_challenge = args.challenge;
	}

	var submitChallenge = function (challenge) {
		var minifyChallenge = function (complexChallenge) {
			var nodes = [];

			_.forEach(complexChallenge.nodes, function (n, i) { 
				var node = {
					index: n.index,
					generators: n.generators
				}

				nodes.push(node);
			})

			var challenge = {
				guid: complexChallenge.guid,
				nodes: nodes
			}

			return challenge;
		}

		var minifiedChallenge = minifyChallenge(challenge);

		var pass = true;
		var optimalCost = 15;
		var environmentalFootprint = 10;

		var nodes = [];
		var links = [];

		_.forEach(_.range(0, 24), function (i) {
			var node = {
				index: i,
				demand: 3,
				value: 5
			}

			nodes.push(node);

			var link = {
				index: i,
				capacity: 5,
				value: 4
			}

			links.push(link);
		})

		var lastIteration = {
			nodes: nodes,
			links: links
		}

		fakeAPI('submit', minifiedChallenge);

		var evaluation = {
			pass: pass,
			optimalCost: optimalCost,
			lastIteration: lastIteration,
			environmentalFootprint: environmentalFootprint
		}

		var res = {
			status: 'OK',
			evaluation: evaluation
		}

		return res;
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