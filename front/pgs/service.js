app.service('DataService', function () {
    var getChallenges = function (args) {
        var headers = { team_name: args.teamname || '' };

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: API_ADDRESS.getAllChallenges,
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


    this.getChallenges = function (args) { return getChallenges(args); }
    this.getChallenge = function (args) { return getChallenge(args); }
    this.getLeaderBoard = function (args) { return getLeaderBoard(args); }
    this.submitChallenge = function (args) { return submitChallenge(args); }
})