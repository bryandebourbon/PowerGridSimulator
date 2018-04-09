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

var regionColors = [{ index: 0, color: '#ff6666' },
                    { index: 1, color: '#33ccff' },
                    { index: 2, color: '#ff9900' },
                    { index: 3, color: '#00b300' },
                    { index: 4, color: '#ff9900' },
                    { index: 5, color: '#99004d' },
                    { index: 6, color: '#66b3ff' },
                    { index: 7, color: '#ffff00' },
                    { index: 8, color: '#660066' },
                    { index: 9, color: '#6666ff' }];

var iconPrefix = './visuals/icons/';
var generatorConfigs = [{ index: 0, type: 'Gas', img: iconPrefix + 'Gas.png' },
                        { index: 1, type: 'Hydro', img: iconPrefix + 'Hydro.png' },
                        { index: 2, type: 'Nuclear', img: iconPrefix + 'Nuclear.png' },
                        { index: 3, type: 'Solar', img: iconPrefix + 'Solar.png' },
                        { index: 4, type: 'Wind', img: iconPrefix + 'Wind.png' }];


var powerLineConfigs = [{ target: { index: 1, lng: -88.11035156249999, lat: 52.4292222779551 }, source: { index: 0, lng: -81.7822265625, lat: 48.341646172374 }},
                        { target: { index: 5, lng: -81.5625, lat: 48.19538740833338}, source: { index: 1, lng: -79.0576171875, lat: 45.27488643704891 }},
                        { target: { index: 3, lng: -75.4541015625, lat: 45.336701909968106 }, source: { index: 2, lng: -77.0361328125, lat: 44.653024159812 }},
                        { target: { index: 5, lng: -79.3212890625, lat: 43.731414013769 }, source: { index: 4, lng: -79.0301513671875, lat: 45.178164812206376 }},
                        { target: { index: 7, lng: -80.71105957031249, lat: 43.56447158721811 }, source: { index: 5, lng: -79.0521240234375, lat: 45.236217535866025 }},
                        { target: { index: 7, lng: -80.738525390625, lat: 43.538593801442374 }, source: { index: 6, lng: -81.60919189453125, lat: 44.16250418310723 }},
                        { target: { index: 9, lng: -80.7220458984375, lat: 43.534611617432816 }, source: { index: 7, lng: -82.08709716796875, lat: 42.48019996901214 }},
                        { target: { index: 9, lng: -80.7275390625, lat: 43.534611617432816 }, source: { index: 8, lng: -79.17022705078125, lat: 43.02874525134882 }},
                        { target: { index: 4, lng: -77.1734619140625, lat: 44.53959000445632 }, source: { index: 3, lng: -79.3267822265625, lat: 43.71950494269107 }},
                        { target: { index: 7, lng: -80.71929931640624, lat: 43.54655738051152 }, source: { index: 4, lng: -79.31854248046875, lat: 43.72942933300513 }}]

var regionLabelConfigs = [{ index: 0, lng: -88.11035156249999, lat: 52.4292222779551 },
                            { index: 1, lng: -81.7822265625, lat: 48.341646172374 },
                            { index: 2, lng: -75.4541015625, lat: 45.336701909968106 },
                            { index: 3, lng: -77.0361328125, lat: 44.653024159812 },
                            { index: 4, lng: - 79.3212890625, lat: 43.731414013769 },
                            { index: 5, lng: -79.0301513671875, lat: 45.178164812206376 },
                            { index: 6, lng: -81.60919189453125, lat: 44.16250418310723 },
                            { index: 7, lng: -80.738525390625, lat: 43.538593801442374 },
                            { index: 8, lng: -79.17022705078125, lat: 43.02874525134882 },
                            { index: 9, lng: -82.08709716796875, lat: 42.48019996901214 }];

var installationOffsets = [{ type: 'Wind', offset: 0 },
                            { type: 'Solar', offset: 5 },
                            { type: 'Nuclear', offset: 10 },
                            { type: 'Hydro', offset: 15 },
                            { type: 'Gas', offset: 20 }];
var regionCentroids = [{ name: 'Northwest', x: 235, y: 90, scale: 1 },
                    { name: 'Northeast', x: 257, y: 105, scale: 0.6 },
                    { name: 'Essa', x: 269.5, y: 118, scale: 0.23 },
                    { name: 'East', x: 274.5, y: 120, scale: 0.23 },
                    { name: 'Southwest', x: 265.5, y: 123.3, scale: 0.23 },
                    { name: 'Ottawa', x: 281.1, y: 116.6, scale: 0.1 },
                    { name: 'Toronto', x: 272, y: 122.5, scale: 0.08 },
                    { name: 'Bruce', x: 264.5, y: 121, scale: 0.1 },
                    { name: 'West', x: 263, y: 127, scale: 0.1 },
                    { name: 'Niagara', x: 271.6, y: 125.5, scale: 0.07 }];

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
