var initFirebase = function () {
    var config = {
        apiKey: 'AIzaSyBb2wL0Zu7sd5SSFArD_5tYvWiZsT7HFJ4',
        authDomain: 'power-grid-simulator.firebaseapp.com',
        databaseURL: 'https://power-grid-simulator.firebaseio.com',
        projectId: 'power-grid-simulator',
        storageBucket: 'power-grid-simulator.appspot.com',
        messagingSenderId: '1052485562020'
    }

    firebase.initializeApp(config);
}

var multiplexArray = function (data) {
    var data24h = data.length != 24 ? [] : data;

    if (data.length == 6) {
        _.forEach(data, function (v) {
            _.forEach([1, 2, 3, 4], function (i) {
                data24h.push(v);
            })
        })
    }

    // check if data array already processed
    var head = _.head(data);
    if (typeof head == 'object') {
        return;
    }

    var res = [];
    _.forEach(data24h, function (v, i) {
        var info = {
            key: i,
            value: v
        }

        res.push(info);
    })

    return res;
}
var parsePolynomial = function (args) {
    var type = args[0] == 2 ? 'polynomial' : 'piecewise';

    var startUpCost = args[1];
    var shutDownCost = args[2];

    var degree = args[3];

    var coefficients = args.slice(4).reverse();

    var data = [];
    if (type == 'polynomial') {
        _.forEach(_.range(11), function (xi) {
            var yi = 0;

            _.forEach(coefficients, function (c, i) {
                yi = yi + c * Math.pow(xi, i);
            })

            data.push({ key: xi, value: yi });
        })
    }

    return data;
}
var drawLineChart = function (args) {
    // we have the option of drawing a line chart with 1 line or with 2 lines
    // args.container: container id for the chart svg
    // args.data: [[data1](, [data2], [data3], ...)]

    var _vis = $(args.container);
    _vis.children().remove();

    var vis = d3.select(args.container);

    var width = vis.attr('width');
    var height = vis.attr('height');
    var margin = .2 * width;

    var colors = ['black', 'red'];

    var x = d3.scale.linear().range([margin, width - margin]).domain([0, d3.max(args.data[0], function (d) { return d.key; })]);
    var y = d3.scale.linear().range([height - margin, margin]).domain([d3.min(args.data[0], function (d) { return d.value; }) < 0 ? d3.min(args.data[0], function (d) { return d.value; }) : 0, d3.max(args.data[0], function (d) { return d.value; }) > 0 ? d3.max(args.data[0], function (d) { return d.value; }) : 0]);

    var xAxis = d3.svg.axis().scale(x).ticks(4);
    var yAxis = d3.svg.axis().scale(y).orient('left').ticks(1);

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

    _.forEach(args.data, function (d, i) {
        vis.append('svg:path')
            .attr('class', 'pgs-path')
            .attr('d', line(args.data[i]))
            .attr('stroke', colors[i])
            .attr('stroke-width', 2)
            .attr('fill', 'none');
    })
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

var showSpinner = function () {
    $('#pgs-app').addClass('pgs-dim');

    $('.pgs-spinner').show();
}
var hideSpinner = function () {
    $('#pgs-app').removeClass('pgs-dim');
    
    $('.pgs-spinner').hide();
}

initFirebase();