
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
		    .scaleExtent([1, 40])
		    .on('zoom', function () { return handleZoom(); });

		var drag = d3.behavior.drag()
		    .origin(function(d) { return { x: d.x, y: d.y }; })
		    .on('dragstart', function (d) { return handleDragStart(d); })
		    .on('drag', function (d) { return handleDrag(d); })
		    .on('dragend', function (d) { return handleDragEnd(d); });


		var svg = d3.select('.pgs-simulation')
			.append('svg')
				.attr('id', 'pgs-simulation-svg')
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
				.attr('x', -width)
				.attr('y', -height)
				.attr('width', width * 2)
				.attr('height', height * 2)
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

								updateTrayInventories($scope.challenge.generators,0);

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
						.style('font-size', 1.5)
						.style('cursor', 'default')
						.on('click', function (d) {
							d3.event.stopPropagation();

							repaintRegions();
							repaintTransmissionLines();

							_.forEach(d3.selectAll('.power-zones g path')[0], function (p) {
								pe = d3.select(p);

								if (pe.data() && pe.data().length && pe.data()[0] && pe.data()[0].index == index) {
									pe.style('fill', '#737373').style('opacity', 1);
								}
							})

							$scope.handleClick({ type: 'node', index: index });
						 })
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

				var westOfSource = (targetX - sourceX) < 0;
				if (westOfSource) {
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

			var textOffset = 50;

			var gen = gGenerators.selectAll('g')
				.data(power_generators)
				.enter()
				.append('g');
				gen.append('image')
				.attr('id', function (d) { return d._guid; })
				.attr('x', function (d) { return d.x; })
				.attr('y', function (d) { return d.y; })
				.attr('xlink:href', function (d) { return d.img; })
				.attr('height', '50px')
				.call(drag);

				gen.append('text')
				.data(power_generators)
				.text("0")
				.attr('id',function (d) { return "inventory-" + d.type })
				.attr('x', function (d) { return d.x + textOffset; })
				.attr('y', function (d) { return d.y + textOffset; })
				.attr('text-anchor', 'middle')
				.style('font-size', 15)

				updateTrayInventories($scope.challenge.generators);



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

			var targetHTML = document.elementFromPoint(coords.x, coords.y);
			var target = d3.select(targetHTML);

			if (target.data && typeof target.data == 'function' && !target.data()[0]) {
				showWarning('Installation unsuccessful, try zooming in or using the side panel to add generator.');

				$scope.revertDrag({ type: d.type });
				return;
			}

			if (target.data && typeof target.data == 'function' && target.data().length && target.data()[0] && target.data()[0].type == 'Feature') {
				var index = _.head(target.data()).index;

				var regionEntry = _.find(nodeMap, function (n) { return n.index == index; });
				var regionName = regionEntry.name;

				var regionCentroid = _.find(regionCentroids, function (c) { return c.name == regionName; });

				var installationScale = regionCentroid.scale;
				var installationHeight = 5 * installationScale;

				var installationOffset = _.find(installationOffsets, function (io) { return io.type == d.type; });
				var installationOffsetX = installationOffset.offset * installationScale;
				var textOffset = 50 * installationScale;
				var installationOffsetY = 0;

				var centroidX = regionCentroid.x;
				var centroidY = regionCentroid.y;

				var installationX = centroidX + installationOffsetX;
				var installationY = centroidY;

				$scope.handleDrop({ type: d.type, target: index });


				var nodeStats = _.find($scope.challenge.nodes, function (c) { return c.name == regionName; });
				if (nodeStats){
					var genStat = _.find(nodeStats.generators, function (c) { return c.type == d.type; });
					genVal = genStat == null ?  1: genStat.count;
				} else {
					genVal = 1;
				}

				console.log($scope.challenge.generators);
				addGenerators({ index: targetHTML,
					type: d.type,
					trayCount: _.find($scope.challenge.generators, function (c) { return c.type == d.type; }).count,
					nodeCount: genVal,
					regionName: regionName});

				//
				// var gen  = d3.select(targetHTML.parentElement).append('g');
				//
				// 	gen.append('image')
				// 	.attr('id', regionName + '-' + d.type)
				// 	.attr('x', installationX)
				// 	.attr('y', installationY)
				// 	.attr('xlink:href', d.img)
				// 	.attr('height', installationHeight + 'px');
				//
				// 	gen.append('text')
				// 	.text(genVal)
				// 	.attr('id', 'inv-' + regionName + '-' +  d.type )
				// 	.attr('x', installationX )
				// 	.attr('y', installationY)
				// 	.attr('text-anchor', 'middle')
				// 	.style('font-size', 15)
				//
				//
				// updateTrayInventories($scope.challenge.generators)


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

	var addGenerators = function (args) {
		// var args = {
		// 	index: $(".power-zones").find("path")[0],
		// 	type: "Solar",
		// 	trayCount: 10,
		// 	nodeCount: 2,
		// 	regionName: "Northwest"
		//
		// }
		// updateTrayInventories()
		$("#inventory-" + args.type).html(args.trayCount);


		if ( $("#inv-"+ args.regionName + "-" + args.type).length != 0 ) {
			$("#inv-"+ args.regionName + "-" + args.type).html(args.nodeCount)
		}
		else{

			var i = 0;
			while (i < generatorConfigs.length) {
				if (generatorConfigs[i].type == args.type) {
					var imageMount = generatorConfigs[i].img;
					break;
				}
				i++;
			}

			var regionName = args.regionName;

			var regionCentroid = _.find(regionCentroids, function (c) { return c.name == regionName; });

			var installationScale = regionCentroid.scale;
			var installationOffset = _.find(installationOffsets, function (io) { return io.type == args.type; });
			var installationOffsetX = installationOffset.offset * installationScale;
			var installationOffsetY = 0;

			var centroidX = regionCentroid.x;
			var centroidY = regionCentroid.y;

			var installationX = centroidX + installationOffsetX;
			var installationY = centroidY;

			var textOffset = 5

			var gen  = d3.select(args.index.parentElement).append('g');

				gen.append('image')
					.attr('id', regionName + '-' + args.type)
					.attr('x', installationX)
					.attr('y', installationY)
					.attr('xlink:href', imageMount)
					.attr('height', 5 * installationScale + 'px')
					;

				gen.append('text')
				.text(args.nodeCount)
				.attr('id', 'inv-' + regionName + '-' +  args.type )
				.attr('x', installationX + textOffset*installationScale)
				.attr('y', installationY + textOffset*installationScale)
				.attr('text-anchor', 'middle')
				.style('font-size', 2*installationScale);
		}
	}
	var removeGenerators = function (args) {
		// var args = {
		// 	type: "Solar",
		// 	count: 0,
		// 	trayCount: 10,
		// 	nodeCount: 2,
		// 	regionName: "Northwest"
		//
		// }

		$("#inventory-" + args.type).html(args.trayCount);

		if ( $("#inv-"+ args.regionName + "-" + args.type).length != 0 ) {
			$("#inv-"+ args.regionName + "-" + args.type).html(args.nodeCount)

		}
		if (args.nodeCount == 0){
			$("#" + args.regionName + "-" + args.type).remove();
			$("#inv-"+ args.regionName + "-" + args.type).remove();
		}

	}

	var updateTrayInventories = function (args) {
		var i = 0;
		while (i < args.length){
			$("#inventory-" + args[i].type).html(args[i].count)
			i  = i + 1;
		}
	}

	// var updateNodeInventories = function (args) {
	// 	var i = 0;
	// 	while (i < args.length){
	// 		$("#inv-"+ args[i].+ "-" + args[i].type).html(args[i].count)
	// 		i  = i + 1;
	// 	}
	// }

	return {
		render: function ($scope) { return render($scope); },
		addGenerators: function (args) { return addGenerators(args); },
		removeGenerators: function (args) { return removeGenerators(args); }
	}
})();
