/* data prefix */
var geoJsonPrefix = './Visuals/Geojson/';
var iconPrefix = './Visuals/Icons/';

/* region configs */
var regionConfigs = [{ index: 0, name: 'Northwest', x: 235, y: 90, scale: 1, color: '#ff6666', lng: -88.11035156249999, lat: 52.4292222779551, geoJson: geoJsonPrefix + 'Northwest.geo.topojson' },
                    { index: 1, name: 'Northeast', x: 257, y: 105, scale: 0.6, color: '#33ccff', lng: -81.7822265625, lat: 48.341646172374, geoJson: geoJsonPrefix + 'Northeast.geo.topojson' },
                    { index: 2, name: 'Ottawa', x: 281.1, y: 116.6, scale: 0.1, color: '#ff9900', lng: -75.4541015625, lat: 45.336701909968106, geoJson: geoJsonPrefix + 'Ottawa.geo.topojson' },
                    { index: 3, name: 'East', x: 274.5, y: 120, scale: 0.2, color: '#00b300', lng: -77.0361328125, lat: 44.653024159812, geoJson: geoJsonPrefix + 'East.geo.topojson' },
                    { index: 4, name: 'Toronto', x: 272, y: 122.5, scale: 0.08, color: '#ff9900', lng: - 79.3212890625, lat: 43.731414013769, geoJson: geoJsonPrefix + 'Toronto.geo.topojson' },
                    { index: 5, name: 'Essa', x: 269.5, y: 118, scale: 0.23, color: '#99004d', lng: -79.0301513671875, lat: 45.178164812206376, geoJson: geoJsonPrefix + 'Essa.geo.topojson' },
                    { index: 6, name: 'Bruce', x: 264.5, y: 121, scale: 0.1, color: '#66b3ff', lng: -81.60919189453125, lat: 44.16250418310723, geoJson: geoJsonPrefix + 'Bruce.geo.topojson' },
                    { index: 7, name: 'Southwest', x: 265.5, y: 123.3, scale: 0.23, color: '#ffff00', lng: -80.738525390625, lat: 43.53859380144237, geoJson: geoJsonPrefix + 'Southwest.geo.topojson' },
                    { index: 8, name: 'Niagara', x: 271.6, y: 125.5, scale: 0.07, color: '#660066', lng: -79.17022705078125, lat: 43.02874525134882, geoJson: geoJsonPrefix + 'Niagara.geo.topojson' },
                    { index: 9, name: 'West', x: 263, y: 127, scale: 0.1, color: '#6666ff', lng: -82.08709716796875, lat: 42.48019996901214, geoJson: geoJsonPrefix + 'West.geo.topojson' }];

/* power line configs */
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

/* generator configs */
var generatorConfigs = [{ type: 'Gas', abbreviation: 'G', img: iconPrefix + 'Gas.png', offset: 0 },
                        { type: 'Hydro', abbreviation: 'H', img: iconPrefix + 'Hydro.png', offset: 5 },
                        { type: 'Nuclear', abbreviation: 'N', img: iconPrefix + 'Nuclear.png', offset: 10 },
                        { type: 'Solar', abbreviation: 'S', img: iconPrefix + 'Solar.png', offset: 15 },
                        { type: 'Wind', abbreviation: 'W', img: iconPrefix + 'Wind.png', offset: 20 }];

/* firebase configs */
var firebaseConfigs = {
    apiKey: 'AIzaSyBb2wL0Zu7sd5SSFArD_5tYvWiZsT7HFJ4',
    authDomain: 'power-grid-simulator.firebaseapp.com',
    databaseURL: 'https://power-grid-simulator.firebaseio.com',
    projectId: 'power-grid-simulator',
    storageBucket: 'power-grid-simulator.appspot.com',
    messagingSenderId: '1052485562020'
}

/* backend API entry points  */
/* local (Annie) */
var API_ADDRESS = {
    getAllChallenges: 'http://127.0.0.1:5000/api/getChallenge/',
    getSingleChallenge: 'http://127.0.0.1:5000/api/getChallenge/',
    submitChallenge: 'http://127.0.0.1:5000/api/submit/',
    getLeaderBoard: 'http://127.0.0.1:5000/api/leaderboard/',
}
/* local (Bryan) */
// var API_ADDRESS = {
//     getAllChallenges: 'http://127.0.0.1:8000/api/getChallenge/',
//     getSingleChallenge: 'http://127.0.0.1:8000/api/getChallenge/',
//     submitChallenge: 'http://127.0.0.1:8000/api/submit/',
//     getLeaderBoard: 'http://127.0.0.1:8000/api/leaderboard/',
// }
/* hosted (pgsim.com) */
// var API_ADDRESS = {
//     getAllChallenges: 'http://pgsim.com:8000/api/getChallenge/',
//     getSingleChallenge: 'http://pgsim.com:8000/api/getChallenge/',
//     submitChallenge: 'http://pgsim.com:8000/api/submit/',
//     getLeaderBoard: 'http://pgsim.com:8000/api/leaderboard/',
// }
