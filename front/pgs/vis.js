var Vis = (function () {
	var render  = function ($scope) {
		var mode = $scope.challenge && $scope.challenge.nodes && $scope.challenge.nodes.length == 2 ? 'SIMPLE' : 'COMPLEX';

		d3.select('#pgs-simulation-svg').remove();

		var width = 750;
		var height = 500 ;

		var _translate = { x: -1413, y: -466 };	// specific values for this SVG size
		var _scale = 6.96;	// specific values for this SVG size

		var zoom = d3.behavior.zoom()
			.translate([_translate.x, _translate.y])
			.scale(_scale)
		    .scaleExtent([.5, 40])
		    .on('zoom', function () { return handleZoom(); });

		var drag = d3.behavior.drag()
		    .origin(function(d) { return { x: d.x, y: d.y }; })
		    .on('dragstart', function (d) { return handleDragStart(d); })
		    .on('drag', function (d) { return handleDrag(d); })
		    .on('dragend', function (d) { return handleDragEnd(d); });


		var svg = d3.select('.pgs-simulation')
			.append('svg')
				.attr('id', 'pgs-simulation-svg')
				.attr('class', 'pgs-simulation')
				.attr('width', width)
				.attr('height', height)
				.on('click', function (d) { 
					repaintRegions();
					repaintTransmissionLines();
					
					$scope.handleClick({ type: 'invalid' });
				 })
			.append('g')
				.call(zoom);

		var projection = d3.geo.mercator();
		var path = d3.geo.path().projection(projection);

		var gMap = svg.append('g').classed('map', true).attr('transform', 'translate(' + _translate.x + ',' + _translate.y + ') scale(' + _scale + ')');
		var gBackground = gMap.append('g').classed('background', true);
		var gOntario = gMap.append('g').classed('ontario', true);
		var gPowerZones = bb = gMap.append('g').classed('power-zones', true);
		var gTranmissionLines = gMap.append('g').classed('transmission-lines', true);

		var gGenerators = svg.append('g').classed('generators', true);

		var renderBackground = function () {
			gBackground.append('rect')
				.attr('width', width)
				.attr('height', height)
				.style('fill', '#e6f7ff')
		}

		var renderOntario = function () {
			var ontarioGeoJson = _.find(geoJsonFiles, function (f) { return f.index == -1; });
			if (ontarioGeoJson) {
				d3.json(ontarioGeoJson.name, function (error, ont) {
					if (error) {
						throw error;
					}

					gOntario.selectAll('path')
						.data([_.merge(topojson.feature(ont, ont.objects.boarderlines).features[0], { index: -1, _guid: guid() })])
						.enter()
						.append('path')
							.attr('id', function (d) { return d._guid; })
							.attr('d', path)
							.style('fill', mode == 'SIMPLE' ? '#000000' : '#737373')
				})
			}
		}

		var renderRegion = function (index) {
			var regionGeoJson = _.find(geoJsonFiles, function (f) { return f.index == index; });
			if (regionGeoJson) {
				d3.json(regionGeoJson.name, function (error, reg) {
					if (error) {
						throw error;
					}

					var _guid = guid();
					gPowerZones.append('g').selectAll('path')
						.data([_.merge(topojson.feature(reg, reg.objects.boarderlines).features[0], { index: index, _guid: _guid })])
						.enter()
						.append('path')
							.attr('id', function (d) { return d._guid; })
							.attr('d', path)
							.style('fill', _.find(regionColors, function (c) { return c.index == index; }).color)
							.style('opacity', .7)
							.on('click', function (d) {
								d3.event.stopImmediatePropagation();
								
								repaintRegions();
								repaintTransmissionLines();

								d3.select(this).style('fill', '#737373').style('opacity', 1);
								
								$scope.handleClick({ type: 'node', index: d.index });
							})

					var labelConfig = _.find(regionLabelConfigs, function (r) { return r.index == index; });
					var labelXY = projection([labelConfig.lng, labelConfig.lat]);

					var labelX = labelXY[0];
					var labelY = labelXY[1];

					d3.select(d3.select('#' + _guid).node().parentNode).append('text')
						.text(_.find(nodeMap, function (n) { return n.index == index; }) ? _.find(nodeMap, function (n) { return n.index == index; }).name : '')
						.attr('x', labelX)
						.attr('y', labelY)
						.attr('text-anchor', 'middle')
						.style('font-size', 1.5);
				});
			}
		}
		var renderRegions = function () {
			_.forEach(_.range(10), function (i) {
				renderRegion(i);
			})
		}
		var renderSelectedRegions = function (nodes) {
			_.forEach(nodes, function (i) {
				renderRegion(i);
			})
		}
		var repaintRegions = function () {
			gPowerZones.selectAll('g path').style('fill', function (d) { return _.find(regionColors, function (c) { return c.index == d.index; }).color }).style('opacity', .7);
		}

		var lngLatToArc = function (d) {
			var bend = 3;

			var source = d.source;
			var target = d.target;

			if (source && target) {
				var sourceXY = projection([source.lng, source.lat]);
				var targetXY = projection([target.lng, target.lat]);

				var sourceX = sourceXY[0];
				var sourceY = sourceXY[1];

				var targetX = targetXY[0];
				var targetY = targetXY[1];

				var dx = targetX - sourceX;
				var dy = targetY - sourceY;
				var dr = Math.sqrt(dx * dx + dy * dy) * bend;

				var west_of_source = (targetX - sourceX) < 0;
				if (west_of_source) {
					return 'M' + targetX + ',' + targetY + 'A' + dr + ',' + dr + ' 0 0,1 ' + sourceX + ',' + sourceY;
				}

				return 'M' + sourceX + ',' + sourceY + 'A' + dr + ',' + dr + ' 0 0,1 ' + targetX + ',' + targetY;
			}

			return 'M0,0,l0,0z';
		}
		var renderAllTransmissionLines = function () {
			var powerLines = _.cloneDeep(powerLineConfigs);
			_.forEach(powerLines, function (l, i) {
				l._i = i;
				l._guid = guid();
			})

			gTranmissionLines.selectAll('path')
				.data(powerLines)
				.enter()
				.append('path')
					.attr('i', function (d) { return d._i; })
					.attr('d', function (d) { return lngLatToArc(d); })
					.style('fill', 'white')
					.on('click', function (d) {
						d3.event.stopImmediatePropagation();

						repaintRegions();
						repaintTransmissionLines();
						
						d3.select(this).style('fill', '#737373');

						$scope.handleClick({ type: 'line', source: d.source.index, target: d.target.index });
					});

		}
		var renderSelectedTransmissionLines = function (lines) {
			var powerLines = [];

			_.forEach(_.cloneDeep(powerLineConfigs), function (l) {
				var line = _.find(lines, function (ln) { return ln.source == l.source.index; ln.target == l.target.index; });

				if (line) {
					powerLines.push(l);
				}
			})

			_.forEach(powerLines, function (l, i) {
				l._i = i;
				l._guid = guid();
			})

			gTranmissionLines.selectAll('path')
				.data(powerLines)
				.enter()
				.append('path')
				.attr('i', function (d) { return d._i; })
				.attr('d', function (d) { return lngLatToArc(d); })
				.style('fill', 'white')
				.on('click', function (d) {
					d3.event.stopImmediatePropagation();

					repaintRegions();
					repaintTransmissionLines();

					d3.select(this).style('fill', '#737373');

					$scope.handleClick({ type: 'line', source: d.source.index, target: d.target.index });
				});
		}
		var repaintTransmissionLines = function () {
			gTranmissionLines.selectAll('g path').style('fill', 'white');
		}

		var renderGenerators = function () {
			var radius = 32;

			var baseHeight = $(window).height() * 0.75 - radius * 2;
			var spacing = width / 5;

			var power_generators = _.cloneDeep(generatorConfigs);
			_.forEach(power_generators, function (g) {
				g._guid = guid();
				g._original = true;

				g._x = width - (g.index + .6) * spacing;
				g._y = baseHeight;

				g.x = g._x;
				g.y = g._y;
			})

			gGenerators.selectAll('image')
				.data(power_generators)
				.enter()
				.append('image')
				.attr('id', function (d) { return d._guid; })
				.attr('x', function (d) { return d.x; })
				.attr('y', function (d) { return d.y; })
				.attr('xlink:href', function (d) { return d.img; })
				.attr('height', '50px')
				.call(drag);
		}

		var handleZoom = function () {
			var transform = { x: d3.event.translate[0], y: d3.event.translate[1], scale: d3.event.scale };

			gMap.attr('transform', 'translate(' + transform.x + ',' + transform.y + ') scale(' + transform.scale + ')');
		}

		var handleDragStart = function (d) {
			d3.event.sourceEvent.stopPropagation();
			d3.select('#' + d._guid).classed('dragging', true);

			if (!d._dragging) {
				d.x = d3.event.x ? d3.event.x : d.x;
				d.y = d3.event.y ? d3.event.y : d.y;

				var dataCopy = _.cloneDeep(d);
				dataCopy._guid = guid();

				dataCopy.x = d._x;
				dataCopy.y = d._y;

				dataCopy._original = true;

				if (d._original) {
					gGenerators.append('image')
						.datum(dataCopy)
						.attr('id', function (d) { return d._guid; })
						.attr('x', function (d) { return d.x; })
						.attr('y', function (d) { return d.y; })
						.attr('xlink:href', function (d) { return d.img; })
						.attr('height', '50px')
						.call(drag);

					delete d._original;
				}

				d._dragging = true;

				$scope.handleDrag({ type: d.type })
			}
		}
		var handleDrag = function (d) {
			if (d._dragging) {
				d.x = d3.event.x;
				d.y = d3.event.y;

				d3.select('#' + d._guid)
					.attr('x', d.x)
					.attr('y', d.y);
			}
		}
		var handleDragEnd = function (d) {
			delete d._dragging;
			var selection = d3.select('#' + d._guid).classed('dragging', false).remove();

			var coords = { x: d3.event.sourceEvent.x, y: d3.event.sourceEvent.y };
			var target = d3.select(document.elementFromPoint(coords.x, coords.y));

			var data = target.data();

			if (target.data && typeof target.data == 'function' && target.data().length > 0 && target.data()[0] && target.data()[0].type == 'Feature') {
				var index = _.head(target.data()).index;

				$scope.handleDrop({ type: d.type, target: index })
			} else {
				$scope.revertDrag({ type: d.type });
			}
		}

		if (mode == 'SIMPLE') {
			renderBackground();

			renderOntario();
			renderSelectedRegions(_.map($scope.challenge.nodes, function (n) { return n.index; }));

			renderSelectedTransmissionLines(_.map($scope.challenge.lines, function (l) { return { source: l.from, target: l.to }}));

			renderGenerators();
		} else {
			renderBackground();

			renderOntario();
			renderRegions();

			renderAllTransmissionLines();

			renderGenerators();
		}
		
	}
		
	return {
		render: function ($scope) { return render($scope); }
	}
})();
