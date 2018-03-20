var Vis = (function () {

	var render  = function () {

		d3.select("svg").remove()

		var width = $( window ).width() * 0.8 ;
			height = $( window ).height() * 0.7;
			scale = (width - 1) / 2 / Math.PI;

		var zoom = d3.behavior.zoom()
		    .translate([width , height ])
		    .scale(scale)
		    .scaleExtent([scale, 50 * scale])
		    .on("zoom", zoomed);
		    // .translate([100,50]).scale(.5);

		var drag = d3.behavior.drag()
		    .origin(function(d) { return d; })
		    .on("dragstart", dragstarted)
		    .on("drag", dragged)
		    .on("dragend", dragended);

		var DropManager = {
				// dragged: null,
				droppable: null,
				// draggedMatchesTarget: function() {
				// 	if (!this.droppable) return false;
				// 	return (dwarfSet[this.droppable].indexOf(this.dragged) >= 0);
				// }
			}

		var svg = d3.select(".pgs-simulation")
			.append("svg")
			.attr('id', 'pgs-simulation')
			.attr('class', '#pgs-simulation')
			.attr("width", width)
			.attr("height", height)
			.append("g")
		    .attr("transform", "translate(" + -5 + "," + -5 + ")")
		   // .attr("transform","translate("+width / 2+","+ height / 2+")scale("+scale+")") 
		    .call(zoom);

		var rect = svg.append("rect")
			.attr("width", width)
		    .attr("height", height)
		    .style("fill", "none")
		    .style("pointer-events", "all");

		var container = svg.append("g");

		projection = d3.geo.mercator().scale(scale)
							.translate([width , height]);
		
		path = d3.geo.path().projection(projection);

		var gBackground = container.append("g"); 
		var gPathPoints = container.append("g");
		var gDataPoints = container.append("g");
		var gPowerZones = container.append("g");
		var gPowerNodes = container .append("g").attr("id", "controler");

		prefix = "./visuals/geojson/";

		//  Load state information to create individual state paths
		d3.json(prefix + "ontario.geo.json", function (error, ont) {
			if (error) throw error;
			gBackground.selectAll("path")
				.attr("width", width)
				.attr("height", height)
			
				.data(topojson.feature(ont, ont.objects.boarderlines).features)
				.enter().append("path")
				.attr("d", path)
				// .attr("class", "state")
				// .style("fill", "blue")
				// .style("opacity", "0.1");
		});
		
		filenames = [
					"Northwest.geo.topojson",
					 "Northeast.geo.topojson",
					 "East.geo.topojson",
					 "Essa.geo.topojson",
					 "West.geo.topojson",
					 "Ottawa.geo.topojson",
					 "Southwest.geo.topojson",
					 "Toronto.geo.topojson",
					 "Niagara.geo.topojson",
					 "Bruce.geo.topojson",
					]

	var tester = function (i) {
		pwr_colors = ["green", "yellow", "red", "purple", "blue", 
						  "orange", "pink", "white", "purple", "blue",
						  "cyan", "brown"]

		filename = prefix + filenames[i]
		//  Load state information to create individual state paths
		d3.json(filename, function (error, pwr) {
			if (error) throw error;
			gPowerZones.append("g").selectAll("path")
				.attr("width", width)
				.attr("height", height)
				.data(topojson.feature(pwr, pwr.objects.boarderlines).features, function (d) { return; })
						//  function(d){ console.log(d)})
				.enter().append("path")
				.attr("d", path)
				.attr("class", "pwrRegions")
				// .attr("class", "installed")
				.style("fill", pwr_colors[i])
				.style("opacity", "0.5")
				.on('mouseover',function(d){
					DropManager.droppable = d3.select(this); 
					// console.log(pwr_colors[i]  + " region is droppable");
				})
				.on('mouseout',function(e){
					DropManager.droppable = null;
					// console.log(pwr_colors[i] + " region is no longle droppable");
				})
				// .on('mouseup',function(e){
				// 	DropManager.droppable = null;
				// 	console.log(pwr_colors[i] + " mouseup detected");
				// });
		});
	}


	for (i = 0; i < 10; i ++){
		tester(i)
	}

	//---- Controler ----
	radius = 32;

	prefix2 = "./visuals/icons/";
	controller_height = $( window ).height()*0.7 - radius * 2;//height/2 //- radius //* 2;
	spacing_factor = width / 5	

	power_generators = [
		{	
	      "type": "Gas", 
	      "img":  prefix2 + "Gas.png",
	      "x": width - spacing_factor,
	      "y": controller_height, 
	      "start_x": width - spacing_factor,
	      "start_y": controller_height,
	      "index": 0, 	      
	    },
	    {
	      "type": "Hydro", 
	      "img":  prefix2 + "Hydro.png",
	      "x": width - 2*spacing_factor,
	      "y": controller_height,
	      "start_x": width - 2*spacing_factor,
	      "start_y": controller_height,
	      "index": 1, 
	    },
	    {
	      "type": "Nuclear", 
	      "img":  prefix2 + "Nuclear.png",
	      "x": width - 3*spacing_factor,
	      "y": controller_height,
	      "start_x": width - 3*spacing_factor,
	      "start_y": controller_height,
	      "index": 2, 
	    },
	    {
	      "type": "Solar", 
	      "img":  prefix2 + "Solar.png",
	      "x": width - 4*spacing_factor,
	      "y": controller_height,
	      "start_x": width - 4*spacing_factor,
	      "start_y": controller_height, 
	      "index": 3,
	    },
	    {
	      "type": "Wind", 
	      "img":  prefix2 + "Wind.png",
	      "x": width - 5*spacing_factor,
	      "y": controller_height,
	      "start_x": width - 5*spacing_factor,
	      "start_y": controller_height,
	      "index": 4, 
	    },
    ]

	var node = gPowerNodes.selectAll("image")
			    .data(power_generators, function(d) { return Math.floor(Math.random() * 200) + 1  ; })
			    .enter()
	    .append("image")
		.attr("x", function(d) { return d.x; })
	    .attr("y", function(d) { return d.y; })
        .attr("xlink:href",  function(d) { return d.img;})
        .attr("height", "50px")
        .call(drag)

		function zoomed() {
			projection
			.translate(zoom.translate())
			.scale(zoom.scale());
			container.selectAll("path").attr("d", path);

			// container.selectAll(".installed")
			// 		.attr("transform", "translate(" + d3.event.translate +
			// 		 ")scale(" + d3.event.scale + ")");

			// $(container.selectAll(".installed")).show();
		};

		function dragstarted(datum) {
			// if (d3.select(this).classed("installed")){
			// 	return
			// }

			d3.event.sourceEvent.stopPropagation();
			d3.select(this).classed("dragging", true);
			// console.log("node");
			// console.log(datum);

			if (datum.start_x == datum.x 
				&& datum.start_y == datum.y){

				if (datum.type == "Gas"){

					newcopy = [{	
							      "type": "Gas", 
							      "img":  prefix2 + "Gas.png",
							      "x": width - spacing_factor,
							      "y": controller_height, 
							      "start_x": width - spacing_factor,
							      "start_y": controller_height,
							      "index": 0, 	      
							    }]

				} 
				else if (datum.type == "Hydro"){
					
					newcopy = [{
							      "type": "Hydro", 
							      "img":  prefix2 + "Hydro.png",
							      "x": width - 2*spacing_factor,
							      "y": controller_height,
							      "start_x": width - 2*spacing_factor,
							      "start_y": controller_height,
							      "index": 1, 
							  }]

				}

				else if (datum.type == "Nuclear"){
					
					newcopy = [{
							      "type": "Nuclear", 
							      "img":  prefix2 + "Nuclear.png",
							      "x": width - 3*spacing_factor,
							      "y": controller_height,
							      "start_x": width - 3*spacing_factor,
							      "start_y": controller_height,
							      "index": 2, 
							    }]

				}

				else if (datum.type == "Solar"){
					
					newcopy = [{
							      "type": "Solar", 
							      "img":  prefix2 + "Solar.png",
							      "x": width - 4*spacing_factor,
							      "y": controller_height,
							      "start_x": width - 4*spacing_factor,
							      "start_y": controller_height, 
							      "index": 3,
							    }]

				}

				else if (datum.type == "Wind"){
					
					newcopy = [{
							      "type": "Wind", 
							      "img":  prefix2 + "Wind.png",
							      "x": width - 5*spacing_factor,
							      "y": controller_height,
							      "start_x": width - 5*spacing_factor,
							      "start_y": controller_height,
							      "index": 4, 
							    }]

				}				
			gPowerNodes.selectAll("image")
		    .data(newcopy, function(d) { return Math.floor(Math.random() * 200) + 1  ; })
		    .enter()
		    .append("image")
			.attr("x", function(d) { return d.x; })
		    .attr("y", function(d) { return d.y; })
	        .attr("xlink:href",  function(d) { return d.img;})
	        .attr("height", "50px")
	        .call(drag)
			} 
		};

		function dragged(d) {
			// if (d3.select(this).classed("installed")){
			// 	return
			// }

			// console.log("x = " + d.x)
			// console.log("y = " + d.y)

			// console.log("event x = " + d3.event.x)
			// console.log("event y = "+ d3.event.y)

			d3.select(this)
			.attr("x", d.x = d3.event.x)
			.attr("y", d.y = d3.event.y);
		};


		function dragended(d,e, f ) {
			if (d3.select(this).classed("installed")){
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
			selection.classed("installed", true);

			var removed = selection.remove();
			
			// sleep(1000);

			// target = DropManager.droppable
			target.append(removed.node());

			svg.selectAll(".installed").call(zoom)

			// console.log(d);
			// console.log(e);
			// console.log(f);
			// .classed("dragging", false);
		};
	};


	return {
		render: function () { return render(); }
	}
})();






