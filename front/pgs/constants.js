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

var geoJsonPrefix = './visuals/geojson/';
var geoJsonFiles = [{ index: -1, name: geoJsonPrefix + 'Ontario.geo.json' },
                    { index: 0, name: geoJsonPrefix + 'Northwest.geo.topojson' },
                    { index: 1, name: geoJsonPrefix + 'Northeast.geo.topojson' },
                    { index: 2, name: geoJsonPrefix + 'East.geo.topojson' },
                    { index: 3, name: geoJsonPrefix + 'Essa.geo.topojson' },
                    { index: 4, name: geoJsonPrefix + 'West.geo.topojson' },
                    { index: 5, name: geoJsonPrefix + 'Ottawa.geo.topojson' },
                    { index: 6, name: geoJsonPrefix + 'Southwest.geo.topojson' },
                    { index: 7, name: geoJsonPrefix + 'Toronto.geo.topojson' },
                    { index: 8, name: geoJsonPrefix + 'Niagara.geo.topojson' },
                    { index: 9, name: geoJsonPrefix + 'Bruce.geo.topojson' }];

var regionColors = [{ index: 0, color: 'green' },
                    { index: 1, color: 'yellow' },
                    { index: 2, color: 'red' },
                    { index: 3, color: 'cyan' },
                    { index: 4, color: 'brown' },
                    { index: 5, color: 'orange' },
                    { index: 6, color: 'pink' },
                    { index: 7, color: 'white' },
                    { index: 8, color: 'purple' },
                    { index: 9, color: 'blue' }];

var iconPrefix = './visuals/icons/';
var generator_configs = [{ index: 0, type: 'Gas', img: iconPrefix + 'Gas.png' },
                        { index: 1, type: 'Hydro', img: iconPrefix + 'Hydro.png' },
                        { index: 2, type: 'Nuclear', img: iconPrefix + 'Nuclear.png' },
                        { index: 3, type: 'Solar', img: iconPrefix + 'Solar.png' },
                        { index: 4, type: 'Wind', img: iconPrefix + 'Wind.png' }];


var API_ADDRESS = {
    getAllChallenges: 'http://127.0.0.1:5000/api/getChallenge/',
    getSingleChallenge: 'http://127.0.0.1:5000/api/getChallenge/',
    submitChallenge: 'http://127.0.0.1:5000/api/submit/',
    getLeaderBoard: 'http://127.0.0.1:5000/api/leaderboard/',
}

// var API_ADDRESS = {
//     getAllChallenges: 'http://127.0.0.1:8000/api/getChallenge/',
//     getSingleChallenge: 'http://127.0.0.1:8000/api/getChallenge/',
//     submitChallenge: 'http://127.0.0.1:8000/api/submit/',
//     getLeaderBoard: 'http://127.0.0.1:8000/api/leaderboard/',
// }


// var API_ADDRESS = {
//     getAllChallenges: 'http://pgsim.com:8000/api/getChallenge/',
//     getSingleChallenge: 'http://pgsim.com:8000/api/getChallenge/',
//     submitChallenge: 'http://pgsim.com:8000/api/submit/',
//     getLeaderBoard: 'http://pgsim.com:8000/api/leaderboard/',
// }

