/* 
** external: can be triggered from external sources
** internal: only accessible from within the library
*/

/*  
**	tag: external
**	use: control of simulation visualization
**	behavior: render map, add and remove generators from map
**	input: none
**	output: { @render, @addGenerators, @removeGenerators }
*/
var Vis = (function () {
	/*  
	**	tag: external
	**	use: render map for visualization
	**	behavior: render map for visualization
	**	input: $scope from visualization directive, containing regions, lines, and inventory information 
	**	output: none
	*/
	var render  = function ($scope) {
		/* mode for distinguishing between whole Ontario map and sub-Ontario map, will need to be modified for more complex configurations */
		var mode = $scope.challenge && $scope.challenge.nodes && $scope.challenge.nodes.length == 2 ? 'SIMPLE' : 'COMPLEX';

		/* clean canvas */
		d3.select('#pgs-simulation-svg').remove();

		/* svg geometry definitions */
		var width = 750;
		var height = 500 ;

		var _translate = { x: -1413, y: -466 };	// specific values for this SVG size
		var _scale = 6.96;	// specific values for this SVG size

		/* d3 behavior definitions */
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

		/* d3 zoom handler */
		var handleZoom = function () {
			var transform = { x: d3.event.translate[0], y: d3.event.translate[1], scale: d3.event.scale };

			gMap.attr('transform', 'translate(' + transform.x + ',' + transform.y + ') scale(' + transform.scale + ')');
		}

		/* d3 drag handlers */
		var handleDragStart = function (d) {
			d3.event.sourceEvent.stopPropagation();

			if (d3.event.sourceEvent.shiftKey || d3.event.sourceEvent.metaKey) {
				d3.event.sourceEvent.preventDefault();

				d._clicked = true;

				$scope.handleClick({ type: 'generator', gType: d.type });
				return;
			}

			var generator = _.find($scope.challenge.generators, function (g) { return g.type == d.type; });
			if (generator.count == 0) {
				d._stuck = true;

				d3.select('#inventory-' + d.type + '-image').classed('stuck', true);
				d3.select('#inventory-' + d.type + '-count').classed('stuck', true);

				return;
			} else {
				delete d._stuck;

				d3.select('#inventory-' + d.type + '-image').classed('stuck', false);
				d3.select('#inventory-' + d.type + '-count').classed('stuck', false);
			}

			d3.select('#inventory-' + d.type + '-image').classed('dragging', true);

			if (!d._dragging) {
				d.x = d3.event.x ? d3.event.x : d.x;
				d.y = d3.event.y ? d3.event.y : d.y;

				var dataCopy = _.cloneDeep(d);
				dataCopy._guid = Guid.generate();

				dataCopy.x = d._x;
				dataCopy.y = d._y;

				dataCopy._original = true;

				if (d._original) {
					gGenerators.append('image')
						.datum(dataCopy)
						.attr('id', function (d) { return 'inventory-' + d.type + '-image'; })
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
			if (d._clicked || d._stuck) {
				return;
			}

			if (d._dragging) {
				d.x = d3.event.x;
				d.y = d3.event.y;

				d3.select('#inventory-' + d.type + '-image')
					.attr('x', d.x)
					.attr('y', d.y);
			}
		}
		var handleDragEnd = function (d) {
			if (d._clicked || d._stuck) {
				delete d._clicked;
				delete d._stuck;

				return;
			}

			delete d._dragging;

			var selection = d3.select('#inventory-' + d.type + '-image').classed('dragging', false).remove();
			var coords = { x: d3.event.sourceEvent.x, y: d3.event.sourceEvent.y };

			var targetHTML = document.elementFromPoint(coords.x, coords.y);
			var target = d3.select(targetHTML);

			if (target.data && typeof target.data == 'function' && !target.data()[0]) {
				Warning.show('Installation unsuccessful, try zooming in or using the side panel to add generator.');

				$scope.revertDrag({ type: d.type });
				return;
			}

			if (target.data && typeof target.data == 'function' && target.data().length && target.data()[0] && target.data()[0].type == 'Feature') {
				var index = _.head(target.data()).index;

				var inventoryGenerator = _.find($scope.challenge.generators, function (g) { return g.type == d.type; });
				var regionPerNodeLimit = _.find(inventoryGenerator.per_node_limit, function (v, i) { return i == index; });
				var region = _.find($scope.challenge.nodes, function (n) { return n.index == index; });
				var regionGeneratorCount = _.find(region.generators, function (g) { return g.type == d.type; }) ? _.find(region.generators, function (g) { return g.type == d.type; }).count : 0;

				if (regionGeneratorCount >= regionPerNodeLimit) {
					Warning.show('Installation exceeds per node limit, please consider other regions.');
					
					$scope.revertDrag({ type: d.type });
					return;
				}

				var regionCentroid = _.find(regionConfigs, function (c) { return c.index == index; });

				var installationScale = regionCentroid.scale;
				var installationHeight = 5 * installationScale;

				var installationOffset = _.find(generatorConfigs, function (io) { return io.type == d.type; });
				var installationOffsetX = installationOffset.offset * installationScale;
				var textOffset = 50 * installationScale;
				var installationOffsetY = 0;

				var centroidX = regionCentroid.x;
				var centroidY = regionCentroid.y;

				var installationX = centroidX + installationOffsetX;
				var installationY = centroidY;

				addGenerators({
					index: index,
					type: d.type,
					count: 1
				});

				$scope.handleDrop({ type: d.type, target: index });
			} else {
				$scope.revertDrag({ type: d.type });
			}
		}

		/* d3 container and group definitions */
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

		/*  
		**	tag: internal
		**	use: render background blue ocean
		**	behavior: render background blue ocean
		**	input: none
		**	output: none
		*/
		var renderBackground = function () {
			gBackground.append('rect')
				.attr('x', -width)
				.attr('y', -height)
				.attr('width', width * 2)
				.attr('height', height * 2)
				.style('fill', '#e6f7ff')
		}

		/*  
		**	tag: internal
		**	use: render underlying Ontario region
		**	behavior: render underlying Ontario region
		**	input: none
		**	output: none
		*/
		var renderOntario = function () {
			var ontarioGeoJson = geoJsonPrefix + 'Ontario.geo.json';
			d3.json(ontarioGeoJson, function (error, ont) {
				if (error) {
					throw error;
				}

				gOntario.selectAll('path')
					.data([_.merge(topojson.feature(ont, ont.objects.boarderlines).features[0], { index: -1, _guid: Guid.generate() })])
					.enter()
					.append('path')
						.attr('id', function (d) { return 'guid-' + d._guid; })
						.attr('d', path)
						.style('fill', mode == 'SIMPLE' ? '#000000' : '#737373')
			})
		}

		/*  
		**	tag: internal
		**	use: render individual region
		**	behavior: render individual region
		**	input: region index
		**	output: none
		*/
		var renderRegion = function (index) {
			var region = _.find(regionConfigs, function (f) { return f.index == index; });
			if (region) {
				d3.json(region.geoJson, function (error, reg) {
					if (error) {
						throw error;
					}

					var _guid = Guid.generate();
					gPowerZones.append('g').selectAll('path')
						.data([_.merge(topojson.feature(reg, reg.objects.boarderlines).features[0], { index: index, _guid: _guid })])
						.enter()
						.append('path')
							.attr('id', function (d) { return 'guid-' + d._guid; })
							.attr('class', 'region-path')
							.attr('region-index', function (d){ return d.index; })
							.attr('d', path)
							.style('fill', _.find(regionConfigs, function (c) { return c.index == index; }).color)
							.style('opacity', .7)
							.on('click', function (d) {
								d3.event.stopImmediatePropagation();

								repaintRegions();
								repaintTransmissionLines();

								d3.select(this).style('fill', '#737373').style('opacity', 1);

								$scope.handleClick({ type: 'node', index: d.index });

							})

					var labelConfig = _.find(regionConfigs, function (r) { return r.index == index; });
					var labelXY = projection([labelConfig.lng, labelConfig.lat]);

					var labelX = labelXY[0];
					var labelY = labelXY[1];

					d3.select(d3.select('#guid-' + _guid).node().parentNode).append('text')
						.text(_.find(regionConfigs, function (n) { return n.index == index; }) ? _.find(regionConfigs, function (n) { return n.index == index; }).name : '')
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
		/*  
		**	tag: internal
		**	use: render all regions within Ontario
		**	behavior: render all regions within Ontario
		**	input: none
		**	output: none
		*/
		var renderRegions = function () {
			_.forEach(_.range(10), function (i) {
				renderRegion(i);
			})
		}
		/*  
		**	tag: internal
		**	use: render selected regions
		**	behavior: render selected regions
		**	input: region indices
		**	output: none
		*/
		var renderSelectedRegions = function (nodes) {
			_.forEach(nodes, function (i) {
				renderRegion(i);
			})
		}
		/*  
		**	tag: internal
		**	use: unselect color for all regions
		**	behavior: repaint color for all regions
		**	input: region index
		**	output: none
		*/
		var repaintRegions = function () {
			gPowerZones.selectAll('g path').style('fill', function (d) { return _.find(regionConfigs, function (c) { return c.index == d.index; }).color }).style('opacity', .7);
		}

		/*  
		**	tag: internal
		**	use: convert source and target { lat, lng } to svg path d value
		**	behavior: convert source and target { lat, lng } to svg path d value
		**	input: d = { source { lat, lng }, target { lat, lng }}
		**	output: none
		*/
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

		/*  
		**	tag: internal
		**	use: render all transmission lines
		**	behavior: render all transmission lines
		**	input: none
		**	output: none
		*/
		var renderAllTransmissionLines = function () {
			var powerLines = _.cloneDeep(powerLineConfigs);
			_.forEach(powerLines, function (l, i) {
				l._i = i;
				l._guid = Guid.generate();
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
		/*  
		**	tag: internal
		**	use: unselect selected transmission lines
		**	behavior: repaint color for selected transmission lines
		**	input: region index
		**	output: none
		*/
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
				l._guid = Guid.generate();
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
		/*  
		**	tag: internal
		**	use: unselect all transmission lines
		**	behavior: repaint color for all transmission lines
		**	input: region index
		**	output: none
		*/
		var repaintTransmissionLines = function () {
			gTranmissionLines.selectAll('g path').style('fill', 'white');
		}

		/*  
		**	tag: internal
		**	use: render all inventory generators with count
		**	behavior: render all inventory generators with count
		**	input: none
		**	output: none
		*/
		var renderGenerators = function () {
			var radius = 32;

			var baseHeight = $(window).height() * 0.75 - radius * 2;
			var spacing = width / 5;

			var generators = _.cloneDeep(generatorConfigs);
			_.forEach(generators, function (g, i) {
				g._guid = Guid.generate();
				g._original = true;

				g._x = width - (i + .6) * spacing;
				g._y = baseHeight;

				g.x = g._x;
				g.y = g._y;
			})

			var textOffset = 50;

			var gen = gGenerators.selectAll('g')
				.data(generators)
				.enter()
				.append('g');
			gen.append('image')
				.attr('id', function (d) { return 'inventory-' + d.type + '-image'; })
				.attr('x', function (d) { return d.x; })
				.attr('y', function (d) { return d.y; })
				.attr('xlink:href', function (d) { return d.img; })
				.attr('height', '50px')
				.call(drag);

			gen.append('text')
				.data(generators)
				.text('0')
				.attr('id',function (d) { return 'inventory-' + d.type + '-count' })
				.attr('x', function (d) { return d.x + textOffset; })
				.attr('y', function (d) { return d.y + textOffset; })
				.attr('text-anchor', 'middle')
				.style('font-size', 15)

			updateInventory($scope.challenge.generators);
		}

		/* official map element rendering */
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

	/*  
	**	tag: external
	**	use: add generators from region
	**	behavior: update generator counts in inventory tray and in regions in vis
	**	input: args = { index, type, count }
	**	output: none
	*/
	var addGenerators = function (args) {
		// update count on the tray in inventory
		var _targetTrayImage = $('#inventory-' + args.type + '-image');
		var _targetTrayCount = $('#inventory-' + args.type + '-count');
		var trayCount = parseInt(_targetTrayCount.html()) - args.count;

		_targetTrayCount.html(trayCount);

		if (trayCount == 0) {
			_targetTrayImage.addClass('stuck');
			_targetTrayCount.addClass('stuck');
		}
		
		// update count in target region
		var _regionInventoryImage = $('#region-' + args.index + '-inventory-' + args.type + '-img');
		var _regionInventoryCount = $('#region-' + args.index + '-inventory-' + args.type + '-count');

		var regionInventoryEmpty = _regionInventoryImage.length == 0 || _regionInventoryCount.length == 0;
		if (regionInventoryEmpty) {
			// add image if region inventory does not exist
			var _regionContainer;
			_.forEach(d3.selectAll('.region-path')[0], function (p) {
				var _regionPath = d3.select(p);
				
				var index = _regionPath.data()[0].index;
				if (index == args.index) {
					_regionContainer = d3.select(p.parentElement);
				}
			})

			var img = _.find(generatorConfigs, function (g) { return g.type == args.type; }).img;
			
			var regionName = _.find(regionConfigs, function (n) { return n.index == args.index; }).name;
			var regionCentroid = _.find(regionConfigs, function (c) { return c.name == regionName; });

			var installationScale = regionCentroid.scale;
			var installationOffset = _.find(generatorConfigs, function (io) { return io.type == args.type; });
			var installationOffsetX = installationOffset.offset * installationScale;
			var installationOffsetY = 0;

			var centroidX = regionCentroid.x;
			var centroidY = regionCentroid.y;

			var installationX = centroidX + installationOffsetX;
			var installationY = centroidY;

			var textOffset = 5;

			var gen = _regionContainer.append('g');
			gen.append('image')
					.attr('id', 'region-' + args.index + '-inventory-' + args.type + '-img')
					.attr('x', installationX)
					.attr('y', installationY)
					.attr('xlink:href', img)
					.attr('height', 5 * installationScale + 'px');

			gen.append('text')
				.text(args.count)
				.attr('id', 'region-' + args.index + '-inventory-' + args.type + '-count')
				.attr('x', installationX + textOffset * installationScale)
				.attr('y', installationY + textOffset *installationScale)
				.attr('text-anchor', 'middle')
				.style('font-size', 2 * installationScale);
		} else {
			// increase count if region inventory exists
			var regionInventoryCount = parseInt(_regionInventoryCount.html()) + args.count;
			_regionInventoryCount.html(regionInventoryCount);
		}
	}

	/*  
	**	tag: external
	**	use: remove generators from regions
	**	behavior: update generator counts in inventory tray and in regions in vis
	**	input: args = { index, type, count }
	**	output: none
	*/
	var removeGenerators = function (args) {
		// update count on the tray in inventory
		var _targetTrayImage = $('#inventory-' + args.type + '-image');
		var _targetTrayCount = $('#inventory-' + args.type + '-count');
		var trayCount = parseInt(_targetTrayCount.html()) + args.count;

		_targetTrayCount.html(trayCount);

		_targetTrayImage.removeClass('stuck');
		_targetTrayCount.removeClass('stuck');


		// update count in target region
		var _regionInventoryImage = $('#region-' + args.index + '-inventory-' + args.type + '-img');
		var _regionInventoryCount = $('#region-' + args.index + '-inventory-' + args.type + '-count');
		var regionInventoryCount = parseInt(_regionInventoryCount.html()) - args.count;

		if (regionInventoryCount == 0) {
			// remove image if region inventory count goes to 0
			_regionInventoryImage.remove();
			_regionInventoryCount.remove();
		} else {
			// reduce count if region inventory count above 0
			_regionInventoryCount.html(regionInventoryCount);
		}
	}

	/*  
	**	tag: internal
	**	use: update inventory tray counts in vis
	**	behavior: update inventory tray counts in vis
	**	input: inventory = [generator1, generator2, ...]
	**	output: none
	*/
	var updateInventory = function (inventory) {
		_.forEach(inventory, function (g) {
			var _trayImage = $('#inventory-' + g.type + '-image');
			var _trayCount = $('#inventory-' + g.type + '-count');

			_trayCount.html(g.count);

			if (g.count == 0) {
				_trayImage.addClass('stuck');
				_trayCount.addClass('stuck');
			}
		})
	}

	/* functions exposed from Vis component to the external */
	return {
		render: function ($scope) { return render($scope); },
		addGenerators: function (args) { return addGenerators(args); },
		removeGenerators: function (args) { return removeGenerators(args); }
	}
})();
