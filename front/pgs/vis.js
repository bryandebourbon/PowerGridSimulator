function Vis () {

	var render  = function () {



		d3.select("svg").remove()

		var width = $( window ).width()*0.8 ;
			height = $( window ).height()*0.7;
			scale = (width - 1) / 2 / Math.PI;

		var zoom = d3.behavior.zoom()
		    .translate([width / 2, height / 2])
		    .scale(scale)
		    .scaleExtent([scale, 50 * scale])
		    .on("zoom", zoomed);

		var drag = d3.behavior.drag()
		    .origin(function(d) { return d; })
		    .on("dragstart", dragstarted)
		    .on("drag", dragged)
		    .on("dragend", dragended);

		var svg = d3.select(".pgs-simulation")
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
		    .attr("transform", "translate(" + -5 + "," + -5 + ")")
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
				.attr("class", "state");

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
				.data(topojson.feature(pwr, pwr.objects.boarderlines).features)
				.enter().append("path")
				.attr("d", path)
				.attr("class", "pwrRegions")
				.style("fill", pwr_colors[i])
				.style("opacity", "0.5"); 
		});
	};


	for (i=0; i < 10;i++){
		tester(i)
	}

	//---- Controler ----
	radius = 32;

	prefix = "./visuals/icons/";
	controller_height = $( window ).height()*0.7 - radius * 2;//height/2 //- radius //* 2;
	spacing_factor = width / 5	

	power_generators = [
		{
	      "type": "Gas", 
	      "img":  prefix + "Gas.png",
	      "x": width - spacing_factor,
	      "y": controller_height, 
	      "start_x": width - spacing_factor,
	      "start_y": controller_height, 	      
	    },
	    {
	      "type": "Hydro", 
	      "img":  prefix + "Hydro.png",
	      "x": width - 2*spacing_factor,
	      "y": controller_height,
	      "start_x": width - 2*spacing_factor,
	      "start_y": controller_height, 
	    },
	    {
	      "type": "Nuclear", 
	      "img":  prefix + "Nuclear.png",
	      "x": width - 3*spacing_factor,
	      "y": controller_height,
	      "start_x": width - 3*spacing_factor,
	      "start_y": controller_height, 
	    },
	    {
	      "type": "Solar", 
	      "img":  prefix + "Solar.png",
	      "x": width - 4*spacing_factor,
	      "y": controller_height,
	      "start_x": width - 4*spacing_factor,
	      "start_y": controller_height, 
	    },
	    {
	      "type": "Wind", 
	      "img":  prefix + "Wind.png",
	      "x": width - 5*spacing_factor,
	      "y": controller_height,
	      "start_x": width - 5*spacing_factor,
	      "start_y": controller_height, 
	    },
    ]



	var node = gPowerNodes.selectAll("image")
	    .data(power_generators)
	    .enter()
	    .append("image")
		.attr("x", function(d) { return d.x; })
	    .attr("y", function(d) { return d.y; })
        .attr("xlink:href",  function(d) { return d.img;})
        .attr("height", "50px")
        .call(drag)


		function zoomed() {
			projection.translate(zoom.translate()).scale(zoom.scale());
			container.selectAll("path").attr("d", path);
		};

		function dragstarted(datum) {
			d3.event.sourceEvent.stopPropagation();
			d3.select(this).classed("dragging", true);
			// console.log("node");
			console.log(datum);


	var node = gPowerNodes.selectAll("image")
	    .data(power_generators, function(d) { return Math.floor(Math.random() * 200) + 1  ; })
	    .enter()
	    .append("image")
		.attr("x", function(d) { return d.x; })
	    .attr("y", function(d) { return d.y; })
        .attr("xlink:href",  function(d) { return d.img;})
        .attr("height", "50px")
        .call(drag)



		};

		function dragged(d) {
			d3.select(this)
			.attr("x", d.x = d3.event.x)
			.attr("y", d.y = d3.event.y);
		};

		function dragended(d) {
			d3.select(this).classed("dragging", false);
		};
	};


	return {
		render: function () { return render(); }
	}
}






