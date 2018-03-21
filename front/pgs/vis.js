var Vis = (function () {
	var render  = function () {
		d3.select('svg').remove();

		var width = .8 * $(window).width();
		var height = .7 * $(window).height();
		var scale = (width - 1) / 2 / Math.PI;

		var zoom = d3.behavior.zoom()
		    // .translate([width , height])
		    // .scale(scale)
		    .scaleExtent([.5, 20])
		    .on('zoom', function () { return handleZoom(); });
		    // .translate([100,50]).scale(.5);

		var drag = d3.behavior.drag()
		    .origin(function(d) { return { x: d.x, y: d.y }; })
		    .on('dragstart', function (d) { return handleDragStart(d); })
		    .on('drag', function (d) { return handleDrag(d); })
		    .on('dragend', function (d) { return handleDragEnd(d); });

		var DropManager = {
				// dragged: null,
				droppable: null,
				// draggedMatchesTarget: function() {
				// 	if (!this.droppable) return false;
				// 	return (dwarfSet[this.droppable].indexOf(this.dragged) >= 0);
				// }
			}

		var svg = d3.select('.pgs-simulation')
			.append('svg')
				.attr('id', 'pgs-simulation')
				.attr('class', '#pgs-simulation')
				.attr('width', width)
				.attr('height', height)
			.append('g')
				.call(zoom)

		var rect = svg.append('rect')
			.attr('width', width)
		    .attr('height', height)
		    .style('fill', 'none')
		    .style('pointer-events', 'all');

		var container = svg.append('g');

		var projection = d3.geo.mercator().scale(scale).translate([width , height]);
		var path = d3.geo.path().projection(projection);

		var gBackground = container.append('g').classed('background', true); 
		var gPathPoints = container.append('g').classed('path-points', true);
		var gDataPoints = container.append('g').classed('data-points', true);
		var gPowerZones = container.append('g').classed('power-zones', true);
		var gGenerators = container.append('g').classed('generators', true);

		var renderOntario = function () {
			var ontarioGeoJson = _.find(geoJsonFiles, function (f) { return f.index == -1; });
			if (ontarioGeoJson) {
				d3.json(ontarioGeoJson.name, function (error, ont) {
					if (error) {
						throw error;
					}

					gBackground.selectAll('path')
						.data([_.merge(topojson.feature(ont, ont.objects.boarderlines).features[0], { index: -1 })])
						.enter()
						.append('path')
							.attr('d', path)
							// .style('fill', 'blue')
							// .style('opacity', '0.1');
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
						.data([_.merge(topojson.feature(reg, reg.objects.boarderlines).features[0], { index: index })])
						.enter()
						.append('path')
							.attr('d', path)
							.style('fill', _.find(regionColors, function (c) { return c.index == index; }) ? _.find(regionColors, function (c) { return c.index == index; }).color : 'black')
							.style('opacity', .5)
							.on('mouseover',function(d) {
								// DropManager.droppable = d3.select(this); 
								// console.log('Mouseover region ', d.index)
							})
							.on('mouseout', function(d){
								DropManager.droppable = null;
							})
							.on('click', function (d) {
								// console.log('Click region ', d.index);
							})
						// .on('mouseup',function(e){
						// 	DropManager.droppable = null;
						// });
				});
			}
		}
		var renderRegions = function () {
			_.forEach(_.range(10), function (i) {
				renderRegion(i);
			})
		}

		//---- Controler ----
		var radius = 32;

		var baseHeight = $(window).height() * 0.7 - radius * 2;//height/2 //- radius //* 2;
		var spacing = width / 5	

		var power_generators = _.cloneDeep(generator_configs);
		_.forEach(power_generators, function (g) {
			g._guid = guid();
			g._original = true;

			g._x = width - (g.index + 1) * spacing;	// default x position
			g._y = baseHeight;	// default y position
			
			g.x = g._x;
			g.y = g._y;
		})

		gGenerators.selectAll('image')
			.data(power_generators)
			.enter()
			.append('image')
				.attr('id', function (d) { return d._guid; })
				.attr('x', function(d) { return d.x; })
				.attr('y', function(d) { return d.y; })
				.attr('xlink:href',  function(d) { return d.img; })
				.attr('height', '50px')
				.call(drag);

		var handleZoom = function () {
			var transform = { x: d3.event.translate[0], y: d3.event.translate[1], scale: d3.event.scale };
		
			gBackground.attr('transform', 'translate(' + transform.x + ',' + transform.y + ') scale(' + transform.scale + ')');
			gPowerZones.attr('transform', 'translate(' + transform.x + ',' + transform.y + ') scale(' + transform.scale + ')');
		}

		var cloneGenerator = function (d) {
			var clone = _.cloneDeep(d);

			clone._guid = guid();

			clone.x = d._x;
			clone.y = d._y;

			clone._original = true;

			return clone;
		}
		var handleDragStart = function (d) {
			d3.event.sourceEvent.stopPropagation();
			d3.select('#' + d._guid).classed('dragging', true);

			if (!d._dragging) {
				d.x = d3.event.x ? d3.event.x : d.x;
				d.y = d3.event.y ? d3.event.y : d.y;

				var dataCopy = cloneGenerator(d);

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
			// if (d3.select(this).classed('installed')){
			// 	return;
			// }
			
			// var coordinates = [0, 0];
			// coordinates = d3.mouse(this);
			// var x = coordinates[0];
			// var y = coordinates[1];

			// elem = document.elementFromPoint(x, y);

			// target = $(elem).parent()

			// console.log(target)
			// selection = d3.select(this)
			// selection.classed('installed', true);

			// var removed = selection.remove();
			
			// // sleep(1000);

			// // target = DropManager.droppable
			// target.append(removed.node());

			// svg.selectAll('.installed').call(zoom);

			d3.select('#' + d._guid).classed('dragging', false);
			delete d._dragging;
		}

		renderOntario();
		renderRegions();
	}
	
	var resize = function () {

	}

	return {
		render: function () { return render(); },
		resize: function () { return resize(); }
	}
})();






