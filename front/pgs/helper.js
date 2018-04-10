var multiplexArray = function (data) {
    var data24h = data.length != 24 ? [] : data;

    if (data.length == 1) {
        _.forEach(data, function (v) {
            _.forEach(_.range(24), function (i) {
                data24h.push(v);
            })
        })
    } else if (data.length == 6) {
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

    var d24h = _.cloneDeep(_.head(res));
    d24h.key = 24;

    res.push(d24h);  // f(24h) <-- f(0h)

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
    var _vis = $(args.container);
    _vis.children().remove();

    var vis = d3.select(args.container);

    var width = vis.attr('width');
    var height = vis.attr('height');
    var margin = { x: .2 * width, y: .2 * height };

    var colors = ['#3498db', '#000000', '#e74c3c'];

    var absolute_ymin = Infinity;
    var absolute_ymax = -Infinity;
    var y_sum = 0;

    _.forEach(args.data, function (g) {
        _.forEach(g, function (d) {
            if (d.value > absolute_ymax) {
                absolute_ymax = d.value;
            }
            if (d.value < absolute_ymin) {
                absolute_ymin = d.value;
            }

            y_sum = y_sum + d.value;
        })
    })

    var dy = absolute_ymax - absolute_ymin;

    var ymin = absolute_ymin - .15 * dy;
    var ymax = absolute_ymax + .15 * dy;
    var ymean = y_sum / args.data.length * args.data[0].length;

    if (ymin == 0 && ymax == 0) {
        ymin = -1;
        ymax = 1;
    }

    if (ymin > 0) {
        ymin = 0;
    }
    if (ymax < 0) {
        ymax = 0;
    }

    var x = d3.scale.linear().range([margin.x, width - margin.x]).domain([0, d3.max(args.data[0], function (d) { return d.key; })]);
    var y = d3.scale.linear().range([height - margin.y, margin.y]).domain([ymin, ymax]);

    var xAxis = d3.svg.axis().scale(x).tickValues(args.type == 'simulation' ? [0, 6, 12, 18, 24] : [0, 5, 10]);
    var yAxis = d3.svg.axis().scale(y).orient('left').tickValues([ymin, ymean, ymax, 0]);

    vis.append('svg:g')
        .attr('class', 'x pgs-axis')
        .attr('transform', 'translate(0,' + (height - margin.y) + ')')
        .call(xAxis);

    vis.append('svg:g')
        .attr('class', 'y pgs-axis')
        .attr('transform', 'translate(' + margin.x + ',0)')
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
            .attr('fill', 'none')
            .style('opacity', '.7')
    })

    vis.append('text')
        .attr('class', 'x label pgs-axis-label')
        .attr('text-anchor', args.type == 'simulation' ? 'middle' : 'start')
        .attr('x', .85 * width)
        .attr('y', .85 * height)
        .text(args.type == 'simulation' ? 'hr' : 'Power (100 MW)');

    vis.append('text')
        .attr('class', 'y label pgs-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', .2 * width)
        .attr('y', .1 * height)
        .text(args.unit);

    // stretch the chart horizontally when we are displaying power vs. cost, the original chart size is simply too small
    if (args.type != 'simulation') {
        vis.attr('width', width * 1.25);
    }
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

var guid = function () {
    var s4 = function () {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return 'g-' + s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    // return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}