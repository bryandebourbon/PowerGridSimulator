app.service('LoginService', function () {
	var init = function () {
		console.log('Login service initiated.');
	}

	var register = function () {
		console.log('User registered.');
	}

	var login = function () {
		console.log('Login successful.');
	}

	this.init = function () { return init(); };
	this.register = function () { return register(); }
	this.login = function () { return login (); }
})

app.service('ChallengesService', function () {
	var init = function () {
		console.log('Challenges service initiated.');
	}

	var previewChallenge = function (cid) {
		console.log('Preview challenge ' + cid);
	}

	var simulateChallenge = function (cid) {
		console.log('Simulate challenge ' + cid);
	}

	this.init = function () { return init(); }
	this.previewChallenge = function (cid) { return previewChallenge(cid); }
	this.simulateChallenge = function (cid, uid) { return simulateChallenge(cid, uid); }
})

app.service('GridService', function () {
	var init = function () {
		console.log('Grid service initiated.');
	}

	this.init = function () { return init(); };
})

app.service('EvaluationService', function () {
	var init = function () {
		console.log('Evaluation service initiated.');
	}

	this.init = init;
})

app.service('LeaderBoardService', function () {
	var init = function () {
		console.log('Leader board service initiated.');
	}

	this.init = init;
})