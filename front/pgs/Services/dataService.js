app.service('DataService', function () {
    /*  
	**	tag: [GET]
	**	use: display all available challenge board
	**	behavior: retrieve all challenges
	**	input: args = { teamname }
	**	output: promise -> challenges = [{ id, name, saved, description }]
	*/
    var getChallenges = function (args) {
        var headers = { team_name: args.teamname || '' };

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: API_ADDRESS.getAllChallenges,
                type: 'GET',
                headers: headers,
                success: function (data) {
                    if (data) {
                        var challenges = JSON.parse(data);

                        resolve(challenges);
                    }
                },
                error: function (data) {
                    reject(data);
                }
            })
        })
    }
    /*  
	**	tag: [GET]
	**	use: display single challenge
	**	behavior: retrieve single challenge by challengeID
	**	input: args = { teamname, challengeID }
	**	output: promise -> challenge = { id, name, description, demands, lines, generators }
	*/
    var getChallenge = function (args) {
        var headers = { team_name: args.teamname || '' };

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: API_ADDRESS.getSingleChallenge + args.challengeID,
                type: 'GET',
                headers: headers,
                success: function (data) {
                    if (data) {
                        var challenge = JSON.parse(data);

                        resolve(challenge);
                    }
                },
                error: function (data) {
                    reject(data);
                }
            })
        })
    }
    /*  
	**	tag: [GET]
	**	use: display leader board
	**	behavior: retrieve up to top 10 leaders for each category
	**	input: args = { teamname }
	**	output: promise -> leaders { category1, category2, category3 }
	*/
    var getLeaderBoard = function (args) {
        var headers = { teamname: args.teamname || '' };

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: API_ADDRESS.getLeaderBoard + args.challengeID,
                type: 'GET',
                headers: headers,
                success: function (res) {
                    var data = JSON.parse(res);

                    resolve(data);
                },
                error: function (data) {
                    reject(data);
                }
            })
        })
    }
    
    /*  
	**	tag: [POST]
	**	use: submit challenge
	**	behavior: submit challenge and retrieve evaluation result
	**	input: args = { teamname, challengeID, challenge }
	**	output: promise -> evaluation = { success, message, evaluation }
	*/
    var submitChallenge = function (args) {
        return new Promise(function (resolve, reject) {
            var minifiChallenge = function (challenge) {
                var mChallenge = [];
                _.forEach(challenge.nodes, function (n) {
                    var node = {
                        node: n.index,
                        generators: {}
                    };

                    _.forEach(n.generators, function (g) {
                        var generatorType = _.find(generatorConfigs, function (gt) { return gt.type == g.type; });

                        if (generatorType) {
                            node.generators[generatorType.abbreviation] = g.count;
                        }
                    })

                    mChallenge.push(node);
                })

                return JSON.stringify(mChallenge);
            }

            var submission = minifiChallenge(args.challenge);
            var headers = { team_name: args.teamname, challenge_id: args.challengeID };

            $.ajax({
                url: API_ADDRESS.submitChallenge,
                type: 'POST',
                headers: headers,
                data: submission,
                success: function (res) {
                    var data = JSON.parse(res);

                    resolve(data);
                },
                error: function (data) {
                    reject(data);
                }
            })
        })
    }

    /* functions exposed from DataService to the external */
    this.getChallenges = function (args) { return getChallenges(args); }
    this.getChallenge = function (args) { return getChallenge(args); }
    this.getLeaderBoard = function (args) { return getLeaderBoard(args); }
    this.submitChallenge = function (args) { return submitChallenge(args); }
})