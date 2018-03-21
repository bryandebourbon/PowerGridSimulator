var Vis = (function () {
	var render  = function ($scope) {
		d3.select('#pgs-simulation-svg').remove();

		var width = 750;
		var height = 500 ;

		var zoom = d3.behavior.zoom()
		    .translate([-1128 , -387])	// specific values for this SVG size
		    .scale(5.85)
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
			.append('g')
				.call(zoom)

		var projection = d3.geo.mercator();
		var path = d3.geo.path().projection(projection);

		var gMap = svg.append('g').classed('map', true).attr('transform', 'translate(-1128, -387) scale(5.85)');
		var gBackground = gMap.append('g').classed('background', true);
		var gPathPoints = gMap.append('g').classed('path-points', true);
		var gDataPoints = gMap.append('g').classed('data-points', true);
		var gPowerZones = gMap.append('g').classed('power-zones', true);

		var gGenerators = svg.append('g').classed('generators', true);

		var renderOntario = function () {
			var ontarioGeoJson = _.find(geoJsonFiles, function (f) { return f.index == -1; });
			if (ontarioGeoJson) {
				d3.json(ontarioGeoJson.name, function (error, ont) {
					if (error) {
						throw error;
					}

					gBackground.selectAll('path')
						.data([_.merge(topojson.feature(ont, ont.objects.boarderlines).features[0], { index: -1, _guid: guid() })])
						.enter()
						.append('path')
							.attr('id', function (d) { return d._guid; })
							.attr('d', path)
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

					gPowerZones.append('g').selectAll('path')
						.data([_.merge(topojson.feature(reg, reg.objects.boarderlines).features[0], { index: index, _guid: guid() })])
						.enter()
						.append('path')
							.attr('id', function (d) { return d._guid; })
							.attr('d', path)
							.style('fill', _.find(regionColors, function (c) { return c.index == index; }) ? _.find(regionColors, function (c) { return c.index == index; }).color : 'black')
							.style('opacity', .5)
							.on('click', function (d) {
								$scope.handleClick({ type: 'node', index: d.index });
							})
				});
			}
		}

		function lngLatToArc(d, sourceName, targetName, bend){
		// If no bend is supplied, then do the plain square root
		bend = bend || 1;
		// `d[sourceName]` and `d[targetname]` are arrays of `[lng, lat]`
		// Note, people often put these in lat then lng, but mathematically we want x then y which is `lng,lat`

		var sourceLngLat = d[sourceName],
				targetLngLat = d[targetName];

		if (targetLngLat && sourceLngLat) {
			var sourceXY = projection( sourceLngLat ),
					targetXY = projection( targetLngLat );

			// Uncomment this for testing, useful to see if you have any null lng/lat values
			// if (!targetXY) console.log(d, targetLngLat, targetXY)
			var sourceX = sourceXY[0],
					sourceY = sourceXY[1];

			var targetX = targetXY[0],
					targetY = targetXY[1];

			var dx = targetX - sourceX,
					dy = targetY - sourceY,
					dr = Math.sqrt(dx * dx + dy * dy)*bend;

			// To avoid a whirlpool effect, make the bend direction consistent regardless of whether the source is east or west of the target
			var west_of_source = (targetX - sourceX) < 0;
			if (west_of_source) return "M" + targetX + "," + targetY + "A" + dr + "," + dr + " 0 0,1 " + sourceX + "," + sourceY;
			return "M" + sourceX + "," + sourceY + "A" + dr + "," + dr + " 0 0,1 " + targetX + "," + targetY;

		} else {
			return "M0,0,l0,0z";
		}
	}
		var renderRegions = function () {
			_.forEach(_.range(10), function (i) {
				renderRegion(i);
			})

			var arcdata =
			  [{
			      target:[-88.11035156249999, 52.4292222779551 ],
			      source:[-81.7822265625, 48.341646172374 ]
			    },

			    {
			     target:[-81.5625, 48.19538740833338 ],
			     source:[-79.0576171875, 45.27488643704891 ]
			    },
			    {
			     target: [ -75.4541015625, 45.336701909968106 ],
			     source: [-77.0361328125, 44.653024159812 ]
			    },
			    {
			     target: [-79.3212890625, 43.731414013769 ],
			     source: [-79.0301513671875, 45.178164812206376 ]
			    },
			    {
			     target:[    -80.71105957031249,     43.56447158721811 ],
			     source:[    -79.0521240234375,     45.236217535866025 ]
			    },
			    {
			     target:[    -80.738525390625,     43.538593801442374 ],
			     source:[    -81.60919189453125,     44.16250418310723 ]
			    },
			    {
			     target:[    -80.7220458984375,     43.534611617432816 ],
			     source:[    -82.08709716796875,     42.48019996901214 ]
			    },
			    {
			     target:[    -80.7275390625,     43.534611617432816 ],
			     source:[    -79.17022705078125,     43.02874525134882 ]
			    },
			    {
			     target:[    -77.1734619140625,     44.53959000445632 ],
			     source:[    -79.3267822265625,     43.71950494269107 ]
			    },
			    {
			     target:[    -80.71929931640624,     43.54655738051152 ],
			     source:[    -79.31854248046875,     43.72942933300513 ]
			    }]
				var arcs = svg.append("g")
							   .attr("class","arcs");

			    arcs.selectAll("path")
		   			.data(arcdata)
		   			.enter()
		   			.append("path")
		   			.attr('d', function(d) {
		   				return lngLatToArc(d, 'source', 'target', 15); // A bend of 5 looks nice and subtle, but this will depend on the length of your arcs and the visual look your visualization requires. Higher number equals less bend.
		   			});

		}

		var renderGenerators = function () {
			var radius = 32;

			var baseHeight = $(window).height() * 0.75 - radius * 2;
			var spacing = width / 5;

			var power_generators = _.cloneDeep(generator_configs);
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
			var selection = d3.select('#' + d._guid).classed('dragging', false);
			selection.remove();



			var coords = { x: d3.event.sourceEvent.x, y: d3.event.sourceEvent.y };
			var target = d3.select(document.elementFromPoint(coords.x, coords.y));



			var parent = $(target).parent();

			parent.append(selection);



			var data = target.data();


			if (target.data && typeof target.data == 'function' && target.data().length > 0 && target.data()[0] && target.data()[0].type == 'Feature') {
				var index = _.head(target.data()).index;

				$scope.handleDrop({ type: d.type, target: index })
			} else {
				$scope.revertDrag({ type: d.type });
			}
		}

		renderOntario();
		renderRegions();

		renderGenerators();
	}

	return {
		render: function ($scope) { return render($scope); }
	}
})();
