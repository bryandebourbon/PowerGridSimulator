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
                    { index: 2, name: geoJsonPrefix + 'Ottawa.geo.topojson' },
                    { index: 3, name: geoJsonPrefix + 'East.geo.topojson' },
                    { index: 4, name: geoJsonPrefix + 'Toronto.geo.topojson' },
                    { index: 5, name: geoJsonPrefix + 'Essa.geo.topojson' },
                    { index: 6, name: geoJsonPrefix + 'Bruce.geo.topojson' },
                    { index: 7, name: geoJsonPrefix + 'Southwest.geo.topojson' },
                    { index: 8, name: geoJsonPrefix + 'Niagara.geo.topojson' },
                    { index: 9, name: geoJsonPrefix + 'West.geo.topojson' }];

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
var generatorConfigs = [{ index: 0, type: 'Gas', img: iconPrefix + 'Gas.png' },
                        { index: 1, type: 'Hydro', img: iconPrefix + 'Hydro.png' },
                        { index: 2, type: 'Nuclear', img: iconPrefix + 'Nuclear.png' },
                        { index: 3, type: 'Solar', img: iconPrefix + 'Solar.png' },
                        { index: 4, type: 'Wind', img: iconPrefix + 'Wind.png' }];


var powerLineConfigs = [{ target: [-88.11035156249999, 52.4292222779551], source: [-81.7822265625, 48.341646172374] },
                        { target: [-81.5625, 48.19538740833338], source: [-79.0576171875, 45.27488643704891] },
                        { target: [-75.4541015625, 45.336701909968106], source: [-77.0361328125, 44.653024159812] },
                        { target: [-79.3212890625, 43.731414013769], source: [-79.0301513671875, 45.178164812206376] },
                        { target: [-80.71105957031249, 43.56447158721811], source: [-79.0521240234375, 45.236217535866025] },
                        { target: [-80.738525390625, 43.538593801442374], source: [-81.60919189453125, 44.16250418310723] },
                        { target: [-80.7220458984375, 43.534611617432816], source: [-82.08709716796875, 42.48019996901214] },
                        { target: [-80.7275390625, 43.534611617432816], source: [-79.17022705078125, 43.02874525134882] },
                        { target: [-77.1734619140625, 44.53959000445632], source: [-79.3267822265625, 43.71950494269107] },
                        { target: [-80.71929931640624, 43.54655738051152], source: [-79.31854248046875, 43.72942933300513] }]


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
