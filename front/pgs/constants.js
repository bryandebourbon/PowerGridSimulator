var nodeMap = [{ index: 0, name: 'Northwest' },
                { index: 1, name: 'Northeast' },
                { index: 2, name: 'Ottawa' },
                { index: 3, name: 'East' },
                { index: 4, name: 'Toronto' },
                { index: 5, name: 'Essa' },
                { index: 6, name: 'Bruce' },
                { index: 7, name: 'Southwest' },
                { index: 8, name: 'Niagara' },
                { index: 9, name: 'West' }];

var generatorTypeMap = [{ abbreviation: 'G', display: 'Gas' },
                        { abbreviation: 'H', display: 'Hydro' },
                        { abbreviation: 'N', display: 'Nuclear' },
                        { abbreviation: 'S', display: 'Solar' },
                        { abbreviation: 'W', display: 'Wind' }];

var STRINGS = {

}

// var API_ADDRESS = {
//     getAllChallenges: 'http://127.0.0.1:5000/api/getChallenge/',
//     getSingleChallenge: 'http://127.0.0.1:5000/api/getChallenge/',
//     submitChallenge: 'http://127.0.0.1:5000/api/submit/',
//     getLeaderBoard: 'http://127.0.0.1:5000/api/leaderboard/',
// }

var API_ADDRESS = {
    getAllChallenges: 'http://127.0.0.1:8000/api/getChallenge/',
    getSingleChallenge: 'http://127.0.0.1:8000/api/getChallenge/',
    submitChallenge: 'http://127.0.0.1:8000/api/submit/',
    getLeaderBoard: 'http://127.0.0.1:8000/api/leaderboard/',
}


// var API_ADDRESS = {
//     getAllChallenges: 'http://pgsim.com:8000/api/getChallenge/',
//     getSingleChallenge: 'http://pgsim.com:8000/api/getChallenge/',
//     submitChallenge: 'http://pgsim.com:8000/api/submit/',
//     getLeaderBoard: 'http://pgsim.com:8000/api/leaderboard/',
// }

