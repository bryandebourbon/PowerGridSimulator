function Vis () {

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

	var render  = function () {
		var width = 500,
			height = 1000,
			scale = 1200;

		//  The projection is used to project geographical coordinates on the SVG
		projection = d3.geo.mercator().scale(scale).translate([width + 1555, height + 460]);

		//  Path is the conversion of geographical shapes (states) to a SVG path 
		path = d3.geo.path().projection(projection);

		//  Map is the SVG which everything is drawn on.
		map = d3.select("#simulator-svg")
			.append("svg")
			.attr("width", width)
			.attr("height", height);


		var gBackground = map.append("g"); 
		var gPathPoints = map.append("g");
		var gDataPoints = map.append("g");
		var gPowerZones = map.append("g");



		var gPowerNodes = map.append("g");
		


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

	for (i=0; i < 10;i++){
		tester(i)
	}

	//---- Controler ----
	radius = 32;

	prefix = "./visuals/icons/";
	controller_height = 14*radius//height/2 //- radius //* 2;
	spacing_factor = width / 5	

	power_generators = [
		{
	      "type": "Gas", 
	      "img":  prefix + "Gas.png",
	      "x": width - spacing_factor,
	      "y": controller_height
	    },
	    {
	      "type": "Hydro", 
	      "img":  prefix + "Hydro.png",
	      "x": width - 2*spacing_factor,
	      "y": controller_height
	    },
	    {
	      "type": "Nuclear", 
	      "img":  prefix + "Nuclear.png",
	      "x": width - 3*spacing_factor,
	      "y": controller_height
	    },
	    {
	      "type": "Solar", 
	      "img":  prefix + "Solar.png",
	      "x": width - 4*spacing_factor,
	      "y": controller_height
	    },
	    {
	      "type": "Wind", 
	      "img":  prefix + "Wind.png",
	      "x": width - 5*spacing_factor,
	      "y": controller_height
	    },
    ]


	var color = d3.scaleCategory20(); //function(){ return "blue" }

	var node = gPowerNodes.selectAll("image")
	    .data(power_generators);

	var nodeEnter = node.enter().append("image")
	    .attr("class", "node")
      	//.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
   


	nodeEnter//.append("svg:circle")	    
		.attr("x", function(d) { return d.x; })
	    .attr("y", function(d) { return d.y; })
	   // .attr("r", radius)
	   // .style("fill", function(d, i) { return color(i); });

//  var images = nodeEnter.append("svg:image")
        .attr("xlink:href",  function(d) { return d.img;})
        .attr("height", "50px")

    gPowerNodes.call(d3.drag()
	    .subject(function() { return d3.event.sourceEvent.target.__data__; })
	    .on("start", dragstarted));

		function dragstarted() {
		  var circle = d3.select(d3.event.sourceEvent.target)
		      .raise()
		      .classed("active", true);

		  d3.event
		      .on("drag", dragged)
		      .on("end", dragended);

		  function dragged() {
		    circle
		        .attr("x", d3.event.subject.x = d3.event.x)
		        .attr("y", d3.event.subject.y = d3.event.y);
		  }

		  function dragended() {
		    circle
		        .classed("active", false);
		    
		  }
		}
	};

	return {
		render: function () { return render(); }
	}
}






