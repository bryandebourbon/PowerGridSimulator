// Initialize Firebase
var config = {
    apiKey: 'AIzaSyBb2wL0Zu7sd5SSFArD_5tYvWiZsT7HFJ4',
    authDomain: 'power-grid-simulator.firebaseapp.com',
    databaseURL: 'https://power-grid-simulator.firebaseio.com',
    projectId: 'power-grid-simulator',
    storageBucket: 'power-grid-simulator.appspot.com',
    messagingSenderId: '1052485562020'
}
firebase.initializeApp(config);

var guid = function () {
    var s4 = function () {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

var drawLineChart = function (args) {
    // we have the option of drawing a line chart with 1 line or with 2 lines
    // args.container: container id for the chart svg
    // args.series: number of lines we want to draw in our chart
    // args.data: [[data1](, [data2], [data3], ...)]

    var _vis = $(args.container);
    _vis.children().remove();

    var vis = d3.select(args.container);

    var width = vis.attr('width');
    var height = vis.attr('height');
    var margin = 20;

    var x = d3.scale.linear().range([margin, width - margin]).domain([0, d3.max(args.data[0], function (d) { return d.key; })]);
    var y = d3.scale.linear().range([height - margin, margin]).domain([0, d3.max(args.data[0], function (d) { return d.value; })]);
    
    var xAxis = d3.svg.axis().scale(x).ticks(4);
    var yAxis = d3.svg.axis().scale(y).orient('left').ticks(0);

    vis.append('svg:g')
        .attr('class', 'x pgs-axis')
        .attr('transform', 'translate(0,' + (height - margin) + ')')
        .call(xAxis);

    vis.append('svg:g')
        .attr('class', 'y pgs-axis')
        .attr('transform', 'translate(' + margin + ',0)')
        .call(yAxis);

    var line = d3.svg.line()
        .x(function (d) { return x(d.key); })
        .y(function (d) { return y(d.value); })
        .interpolate('basis');

    vis.append('svg:path')
        .attr('class', 'pgs-path')
        .attr('d', line(args.data[0]))
        .attr('stroke', 'green')
        .attr('stroke-width', 2)
        .attr('fill', 'none');
}

var parsePolynomial = function (args) {
    var degree = args[0];

    var startUpCost = args[1];
    var shutDownCost = args[2];

    var coefficients = args.slice(3).reverse();

    var data = [];
    _.forEach(_.range(11), function (xi) {
        var yi = 0;

        _.forEach(coefficients, function (c, i) {
            yi = yi + c * Math.pow(xi, i);
        })

        data.push({ key: xi, value: yi });
    })

    return data;
}

var showWarning = function (message) {
    var _alert = $('.pgs-alert');
    var _alertMessage = _alert.find('.pgs-alert-content');

    _alertMessage.text(message);

    _alert.show();

    _.delay(function () { hideWarning(); }, 3000);
}
var hideWarning = function () {
    var _alert = $('.pgs-alert');
    var _alertMessage = _alert.find('.pgs-alert-content');

    _alertMessage.text();

    _alert.hide();
}