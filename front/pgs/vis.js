var Vis = (function () {
	var render  = function () {
		d3.select('svg').remove();

		var width = .8 * $(window).width();
		var height = .7 * $(window).height();
		var scale = (width - 1) / 2 / Math.PI;

		var zoom = d3.behavior.zoom()
		    .translate([width , height])
		    .scale(scale)
		    .scaleExtent([scale, 50 * scale])
		    .on('zoom', zoomed);
		    // .translate([100,50]).scale(.5);

		var drag = d3.behavior.drag()
		    .origin(function(d) { return d; })
		    .on('dragstart', dragstarted)
		    .on('drag', dragged)
		    .on('dragend', dragended);

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
		var gPowerNodes = container.append('g').classed('power-nodes', true).attr('id', 'controler');

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

		var iconPrefix = './visuals/icons/';
		controller_height = $( window ).height()*0.7 - radius * 2;//height/2 //- radius //* 2;
		spacing_factor = width / 5	

		var power_generators = [{ index: 0, type: 'Gas', img: iconPrefix + 'Gas.png', x: width - spacing_factor, y: controller_height, start_x: width - spacing_factor, start_y: controller_height },
			{ index: 1, type: 'Hydro', img: iconPrefix + 'Hydro.png', x: width - 2*spacing_factor, y: controller_height, start_x: width - 2*spacing_factor, start_y: controller_height },
			{ index: 2, type: 'Nuclear', img: iconPrefix + 'Nuclear.png', x: width - 3*spacing_factor, y: controller_height, start_x: width - 3*spacing_factor, start_y: controller_height },
			{ index: 3, type: 'Solar', img: iconPrefix + 'Solar.png', x: width - 4*spacing_factor, y: controller_height, start_x: width - 4*spacing_factor, start_y: controller_height },
			{ index: 4, type: 'Wind', img: iconPrefix + 'Wind.png', x: width - 5*spacing_factor, y: controller_height, start_x: width - 5*spacing_factor, start_y: controller_height }];

		var node = gPowerNodes.selectAll('image')
					.data(power_generators, function(d) { return Math.floor(Math.random() * 200) + 1; })
					.enter()
			.append('image')
			.attr('x', function(d) { return d.x; })
			.attr('y', function(d) { return d.y; })
			.attr('xlink:href',  function(d) { return d.img;})
			.attr('height', '50px')
			.call(drag);

		function zoomed() {
			projection
			.translate(zoom.translate())
			.scale(zoom.scale());
			container.selectAll('path').attr('d', path);

			// container.selectAll('.installed')
			// 		.attr('transform', 'translate(' + d3.event.translate +
			// 		 ')scale(' + d3.event.scale + ')');

			// $(container.selectAll('.installed')).show();
		};

		function dragstarted(datum) {
			// if (d3.select(this).classed('installed')){
			// 	return
			// }

			d3.event.sourceEvent.stopPropagation();
			d3.select(this).classed('dragging', true);
			// console.log('node');
			// console.log(datum);

			if (datum.start_x == datum.x 
				&& datum.start_y == datum.y){

				if (datum.type == 'Gas'){

					newcopy = [{	
								'type': 'Gas', 
								'img':  iconPrefix + 'Gas.png',
								'x': width - spacing_factor,
								'y': controller_height, 
								'start_x': width - spacing_factor,
								'start_y': controller_height,
								'index': 0, 	      
								}]

				} 
				else if (datum.type == 'Hydro'){
					
					newcopy = [{
								'type': 'Hydro', 
								'img':  iconPrefix + 'Hydro.png',
								'x': width - 2*spacing_factor,
								'y': controller_height,
								'start_x': width - 2*spacing_factor,
								'start_y': controller_height,
								'index': 1, 
							}]

				}

				else if (datum.type == 'Nuclear'){
					
					newcopy = [{
								'type': 'Nuclear', 
								'img':  iconPrefix + 'Nuclear.png',
								'x': width - 3*spacing_factor,
								'y': controller_height,
								'start_x': width - 3*spacing_factor,
								'start_y': controller_height,
								'index': 2, 
								}]

				}

				else if (datum.type == 'Solar'){
					
					newcopy = [{
								'type': 'Solar', 
								'img':  iconPrefix + 'Solar.png',
								'x': width - 4*spacing_factor,
								'y': controller_height,
								'start_x': width - 4*spacing_factor,
								'start_y': controller_height, 
								'index': 3,
								}]

				}

				else if (datum.type == 'Wind'){
					
					newcopy = [{
								'type': 'Wind', 
								'img':  iconPrefix + 'Wind.png',
								'x': width - 5*spacing_factor,
								'y': controller_height,
								'start_x': width - 5*spacing_factor,
								'start_y': controller_height,
								'index': 4, 
								}]

				}				
			gPowerNodes.selectAll('image')
			.data(newcopy, function(d) { return Math.floor(Math.random() * 200) + 1  ; })
			.enter()
			.append('image')
			.attr('x', function(d) { return d.x; })
			.attr('y', function(d) { return d.y; })
			.attr('xlink:href',  function(d) { return d.img;})
			.attr('height', '50px')
			.call(drag)
			} 
		};

		function dragged(d) {
			// if (d3.select(this).classed('installed')){
			// 	return
			// }

			// console.log('x = ' + d.x)
			// console.log('y = ' + d.y)

			// console.log('event x = ' + d3.event.x)
			// console.log('event y = '+ d3.event.y)

			d3.select(this)
			.attr('x', d.x = d3.event.x)
			.attr('y', d.y = d3.event.y);
		};


		function dragended(d,e, f ) {
			if (d3.select(this).classed('installed')){
				return
			}

			var coordinates = [0, 0];
			coordinates = d3.mouse(this);
			var x = coordinates[0];
			var y = coordinates[1];

			elem = document.elementFromPoint(x, y);

			target = $(elem).parent()

			console.log(target)
			selection = d3.select(this)
			selection.classed('installed', true);

			var removed = selection.remove();
			
			// sleep(1000);

			// target = DropManager.droppable
			target.append(removed.node());

			svg.selectAll('.installed').call(zoom)

			// console.log(d);
			// console.log(e);
			// console.log(f);
			// .classed('dragging', false);
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






