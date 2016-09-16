var lang = window.location.search.split("=")[1],
		map,
		layersControl, //layers control
		lastfeature,
		clickedfeature,
		drawnItems,
		featureClass,
		timeout,
		esriSat,
		customBaseLayer,
		featurelayers = {},
		activelayers = [],
		previewlayers = [],
		previewLayerNames = [],
		tilelayers = {},
		searchTags = {},
		markerArray = [],
		featureImageCoords = [],
	 	photourl,
	 	audiourl,
	 	measureOn = false,
	 	username = "",
	 	authority = "",
	 	flagsent,
	 	sessionId = String(Math.round(Math.random()*100000000)),
	 	isIE = /*@cc_on!@*/0,
	 	drawType,
		markerStyle = {},
		loadtrigger = 0,
		queryzoom = false,
		tables,
		queryDivCount = 1,
		printPreviewMap,
		markerType,
		featuresToApprove,
		commentsToApprove,
        titleBox,
        legendBox,
		usersites = {};

function initialize() {
    
    // Class variables
	
    
    $("li[name=print]").click(printMap);
    $(".closeDialog").click(function(){
        closeDialog($(this).parents(".whitebox").attr("id"));
        return false;
    });
	function closeDialog(dialog, remove){
		//<-download submit button
		if (remove == true){
			$("#"+dialog).remove();
		} else {
			$("#"+dialog).css("visibility", "hidden");
			$("#"+dialog+" #buttons").css("visibility", "hidden");
		};
		$("#cover").hide();
	};

	function printMap(){
		$("#cover").show();
		$("#printBox").css("visibility", "visible");

		adjustPreviewBox(); //->
		var mapZoom = getMapZoom();

		if (typeof printPreviewMap === 'undefined'){ //only run on first print preview
			setPreview(mapZoom); //->
		} else {
			printPreviewMap.setView(getMapCentre(), getMapZoom());
            $.each(printPreviewMap._layers, function(index, element){
                printPreviewMap.removeLayer(element);
            });
		};
        
        
        // add title
        $('.leaflet-control .printcomponent .maptitle').remove(); 
        var disclaimer = "This map is illustrative only and all information should be independently verified on site before taking any action. Whilst due care has been taken, AGIS Ltd. give no warranty to the accuracy and completeness of any of the information on this map and accepts no liability for any error, omission or use of the information.";
        $($('<div />', {class: "leaflet-control printcomponent maptitle" })).appendTo("#printPreview .leaflet-control-container").append($("<h1 />", { text: $('#maptitle').text() })).append($("<p />", { class: 'disclaimer', text: disclaimer }));
       
        // add legend
        if (legendBox) { legendBox.removeFrom(printPreviewMap); }
        legendBox = L.control({position: 'topright'});
		legendBox.onAdd = function (map) {
			var container = L.DomUtil.create('div', 'printcomponent');
			$(container).html(buildLegend());
			return container;
		};
		legendBox.addTo(printPreviewMap);
        
        // Set each layer of underlying map to the printpreview map
        $.each(map._layers, function(index, element){
            if (element == drawnItems) { return; }
            printPreviewMap.addLayer(cloneLayer(element));
        });

//		setPreviewLayers(); //->

		$("#scalegrip").css({
			"margin-left": String(-182 + ((mapZoom - 11) * 19)) + "px",
		});
        
        window.dispatchEvent(new Event('resize')); // Jiggle elements to correct size.
	};

	function setPreview(mapZoom){        
		printPreviewMap = L.map("printPreview", {
			center: getMapCentre(),
			zoom: mapZoom,
			zoomControl: false,
			attributionControl: false,
			scrollWheelZoom: false,
			touchZoom: false,
			doubleClickZoom: false,
			boxZoom: false,
			tap: false
		});

		L.control.scale({
			imperial: false, position: 'topleft'
		}).addTo(printPreviewMap);

		var northArrow = L.control({position: 'topleft'});
		northArrow.onAdd = function (map) {
			var container = L.DomUtil.create('div', 'northArrow');
			$(container).html('<img src="img/northarrow.png">');
			return container;
		};
		northArrow.addTo(printPreviewMap);
        
        // add logo
		var logo = L.control({position: 'bottomright'});
		logo.onAdd = function (map) {
			var container = L.DomUtil.create('div', 'printcomponent');
			$(container).html($('#banner img').prop('outerHTML'));
			return container;
		};
		logo.addTo(printPreviewMap);

		$("#printButton").click(function(){	

			//transform map pane
			var mapTransform = $("#printPreview .leaflet-map-pane").css("transform"); //get the current transform matrix
			var mmpp = adjustScale(); //get mm per css-pixel
			var multiplier = mmpp[1] * 3.7795; //multiply paper mm per css-pixel by css-pixels per mm to get zoom ratio
			var mapTransform2 = mapTransform + " scale("+ multiplier +")"; //add the scale transform
			$("#printPreview .leaflet-map-pane").css("transform", mapTransform2); //set new transformation

			//set new transform origin to capture panning
			var tfMatrix = mapTransform.split("(")[1].split(")")[0].split(", ");
			var toX = 0 - tfMatrix[4],
				toY = 0 - tfMatrix[5];
			$("#printPreview .leaflet-map-pane").css("transform-origin", toX + "px " + toY + "px");

	        //determine which is long side of paper
	        var sdim, ldim;
	        if ($("#paperOrientation option[value=portrait]").prop("selected")){
	            sdim = "width";
	            ldim = "height";
	        } else {
	            sdim = "height";
	            ldim = "width";
	        };

			//store prior dimensions for reset
			var previewWidth = $("#printPreview").css("width"),
				previewHeight = $("#printPreview").css("height")

			//set the page dimensions for print
			var paperLongside = getLongside(); //paper length in mm minus 20mm total print margins minus border
			$("#printPreview").css(ldim, paperLongside + "mm");
			$("#printPreview").css(sdim, paperLongside/Math.sqrt(2) + "mm");
			$("#container").css("height", $("#printPreview").css("height"));
			
			//adjust the scale bar
			var scaleWidth = parseFloat($("#printBox .leaflet-control-scale-line").css('width').split('px')[0]);
			$("#printBox .leaflet-control-scale-line").css('width', String(scaleWidth * multiplier * 1.1) + "px");
			$("#printBox .leaflet-control-scale").css({
				'margin-bottom': String(5 * multiplier * 1.1) + "px",
				'margin-left': String(5 * multiplier * 1.1) + "px"
			});

			//adjust north arrow
			var arrowWidth = parseFloat($(".northArrow img").css('width').split("px")[0]),
				arrowMargin = parseFloat($(".northArrow").css('margin-top').split("px")[0]);
			$(".northArrow img").css({
				width: String(arrowWidth * multiplier * 1.1) + "px",
				height: String(arrowWidth * multiplier * 1.1) + "px"
			});
			$(".northArrow").css({
				"margin-right": String(arrowMargin * multiplier * 1.1),
				"margin-top": String(arrowMargin * multiplier * 1.1)
			});

			//print
			window.print();

			//reset print preview
			$("#printPreview .leaflet-map-pane").css("transform", mapTransform); //reset to original matrix transform
			$("#printPreview").css({
				width: previewWidth,
				height: previewHeight
			});
			//reset scale bar
			$("#printBox .leaflet-control-scale-line").css('width', scaleWidth+"px");
			$("#printBox .leaflet-control-scale").css({
				'margin-bottom': "",
				'margin-left': ""
			});
			//reset north arrow
			$(".northArrow img").css({
				width: arrowWidth + "px",
				height: arrowWidth + "px"
			});
			$(".northArrow").css({
				"margin-right": arrowMargin,
				"margin-top": arrowMargin
			});
		});

		$(window).resize(function(){
			adjustPreviewBox();
			resizeMarkers(markerType); //->
		});

		$("#paperOrientation select").change(function(){
			adjustPreviewBox(); //->
			resizeMarkers(markerType); //->
		});

		$("#paperSize select").change(function(){
			resizeMarkers(markerType); //->
		});

		$("#markerType input").each(function(){
			$(this).change(function(){
				if ($(this).prop("checked")){ //only call handler once
					changePreviewLayers($(this).val()); //->
				}
			});
		});	

		//adjust map scale according to central latitude
		printPreviewMap.on("moveend", function(){ adjustScale(); })

		//custom scale bar
		$(".scaleimg").click(function(){
			$("#previewLoading").show();
			if ($(this).attr("id") == "plus"){
				//zoom in
				if (mapZoom < 20){ //17 def
					mapZoom++;
					printPreviewMap.setZoom(mapZoom);
				}
			} else {
				//zoom out
				if (mapZoom > 11){ //8 def
					mapZoom--;
					printPreviewMap.setZoom(mapZoom);
				}
			};
			//move scale bar indicator
			$("#scalegrip").css({
				"margin-left": String(-182 + ((mapZoom - 11) * 19)) + "px",
			});
		});
	};

	function changePreviewLayers(symbolType){
		var dir = symbolType == "circle" ? "circle" : "lg";

		$("#printPreview img.leaflet-marker-icon").each(function(){
			var filedir = $(this).attr("src");
			var filename = filedir.split("/")[3];
			$(this).attr("src", "img/markers/" + dir + "/" + filename);
		});

		resizeMarkers(markerType, true); //->
	};

	function setPreviewLayers(){
		//start with all existing layers off
		previewlayers.forEach(function(layer){
			layer.on = false;
		});

		//add checked tile layers as vector overlays
		var checkedTileLayers = [], getTileLayers = [], fields = [];
		for (var layer in tilelayers){
			if ($("input[value="+layer+"]").prop("checked")){
				if (typeof tilelayers[layer].features[0].geometry === 'undefined' && $.inArray(tilelayers[layer].features[0].tablename, getTileLayers) == -1){
					getTileLayers.push(tilelayers[layer].features[0].tablename);
					fields.push("ST_AsGeoJSON(ST_Transform(ST_Force_2D(geom),4326))");
				} else {
					checkedTileLayers.push(tilelayers[layer].features[0].tablename);
				}
			}
		};
		//if geometries aren't in DOM yet, retrieve them; otherwise skip to adding layers
		var go = false;
		if (getTileLayers.length > 0){
			getGeom(getTileLayers, fields); //->
		} else {
			go = true;
		};
		if (checkedTileLayers.length > 0){
			setTileOverlays(checkedTileLayers, false); //->
		};

		//add activelayers not currently in previewlayers
		var activelayerIds = [];
		activelayers.forEach(function(layer, i){
			//exclude corridor segment point features
			if (layer.featurename != 'Corridor-segment' && i%2 == 0){
				//only add new preview layer if one doesn't already exist
				if ($.inArray(layer.featurename, previewLayerNames) == -1){
					var layerKey = Object.keys(layer)[0];
					var newGeoJson = layer[layerKey].toGeoJSON();
					var layerType, onlyLayer = false;
					if (layerKey == "lineLayer"){
						layerType = "lineJsonLayer";
					} else {
						layerType = "iconJsonLayer";
					};
					if (layerKey.indexOf("Only") > -1){
						onlyLayer = true;
					};
					var featureType = newGeoJson.features[0].properties.Type || tables[newGeoJson.features[0].tablename].lyrname.en;
					var geoJsonLayer = new Features[layerType](newGeoJson, newGeoJson.features[0].tablename, featureType, null, onlyLayer);
					geoJsonLayer.on = true;
					previewlayers.push(geoJsonLayer);
				} else {
					//turn layer on
					previewlayers[$.inArray(layer.featurename, previewLayerNames)].on = true;
				};
			};
		});

		//if no AJAX needed, proceed to add layers to preview map
		if (go){ mapPreviewLayers() } //->
	};

	function setLabels(newlabels){
//		//for SVG polygons, add label to center of polygon
//		var g = d3.selectAll('#printPreview g'),
//			scaleVals = adjustScale(),
//			denominator = Math.round(scaleVals[0]/scaleVals[1]),
//			areaTextSize = denominator > 500000 ? '0' : String(8/scaleVals[1]),
//			pointTextSize = denominator > 250000 ? '0' : String(4/scaleVals[1])+'px',
//			labelDivBounds = [];
//		if (newlabels){
//			g.each(function(){
//				var gEl = d3.select(this),
//					path = gEl.select('path');
//				if (path.attr('class').indexOf('|') > -1){
//					var labeltext = path.attr('class').split('|')[0],
//						bbox = path.node().getBBox(),
//						x = bbox.x + bbox.width/2,
//						y = bbox.y + bbox.height/2,
//						color = path.attr('stroke'),
//						textSize = x <= 0 && y <= 0 ? 0 : areaTextSize,
//						text = gEl.append('text')
//						.attr({
//							x: x,
//							y: y,
//							'font-size': textSize,
//							'text-anchor': 'middle',
//							fill: color
//						})
//						.text(labeltext);
//				};
//			});
//		} else {
//			//adjust size and position of svg labels
//			g.each(function(){
//				var gEl = d3.select(this),
//					path = gEl.select('path');
//				if (path.attr('class').indexOf('|') > -1){
//					var text = gEl.select('text'),
//						bbox = path.node().getBBox(),
//						x = bbox.x + bbox.width/2,
//						y = bbox.y + bbox.height/2,
//						textSize = x == 0 && y == 0 ? 0 : areaTextSize;
//					text.attr({
//						x: x,
//						y: y,
//						'font-size': textSize
//					});
//				};
//			});
//			//if scale is large enough, add marker layers to map
//			if (denominator <= 250000){
//				previewlayers.forEach(function(layer){
//					if (layer.hasOwnProperty('labelLayer') && !printPreviewMap.hasLayer(layer.labelLayer)){
//						layer.labelLayer.addTo(printPreviewMap);
//					}
//				});
//				$("#printPreview span").css({
//					'margin-left': pointTextSize,
//					'font-size': pointTextSize,
//					'line-height': pointTextSize
//				});
//			} else {
//				previewlayers.forEach(function(layer){
//					if (layer.hasOwnProperty('labelLayer') && printPreviewMap.hasLayer(layer.labelLayer)){
//						printPreviewMap.removeLayer(layer.labelLayer);
//					}
//				})
//			}
//		};
	};

	function mapPreviewLayers(){
		//sort the layers in table order
		previewlayers.sort(function(a,b){
			return Object.keys(tables).indexOf(a.tablename) < Object.keys(tables).indexOf(b.tablename);
		});
		previewLayerNames = []; //reset layer names array after sort
		//finally, add each layer of the correct symbol type to the map
		previewlayers.forEach(function(layer){
			previewLayerNames.push(layer.featurename); //add layer names back to array
			var layerKey = Object.keys(layer)[0];
			if (layer.on){
				if (!printPreviewMap.hasLayer(layer[layerKey])){
					layer[layerKey].addTo(printPreviewMap);
				};
			} else {
				if (printPreviewMap.hasLayer(layer[layerKey])){
					printPreviewMap.removeLayer(layer[layerKey]);
				};
			};
		});

		resizeMarkers(markerType, true, true); //->
		printPreviewMap.on('zoomend dragend', function(){
			setLabels(false); //->
		});
	};

	function processTileFeatures(data){
		var receivedTileLayers = [];
		var tableGeoms = data.split("|||");
		tableGeoms.forEach(function(geoms){
			geoms = geoms.split("---");
			if (geoms.length > 1){
				//note null geometries
				var jsonArray = '['+geoms[1].substr(0, geoms[1].length-2).replace(/ ,/g, 'null,')+']';
				var tablename = geoms[0], featureGeoms = JSON.parse(jsonArray);
				//set feature geometries in tilelayers object once for each table
				if ($.inArray(tablename, receivedTileLayers) == -1){
					tilelayers[tables[tablename].lyrname.en].features.forEach(function(feature, i){
						feature.geometry = featureGeoms[i];
					});

					receivedTileLayers.push(tablename);
				};
			};
		});
		setTileOverlays(receivedTileLayers, true); //->
	};

	function setTileOverlays(tileOverlays, go){
		tileOverlays.forEach(function(layer){
			//only create new layers if they don't already exist
			var lyrname = tables[layer].lyrname.en;
			var iconIndex = $.inArray(lyrname, previewLayerNames);
			if (iconIndex == -1){
				var geomType = tables[layer].geomType;
				var geoJsonLayer;
				if (geomType == "point"){
					geoJsonLayer = new Features.iconJsonLayer(tilelayers[lyrname], layer, lyrname, null, true);
					//add label layers
					var labelLayer = new Features.labelJsonLayer(tilelayers[lyrname], layer, lyrname);
				} else if (geomType == "line"){
					geoJsonLayer = new Features.lineJsonLayer(tilelayers[lyrname], layer, lyrname);
				} else {
					geoJsonLayer = new Features.polygonJsonLayer(tilelayers[lyrname], layer, lyrname);
				}
				geoJsonLayer.on = true;
				previewlayers.push(geoJsonLayer);
				if (typeof labelLayer != 'undefined'){
					previewlayers.push(labelLayer);
				};
			} else {
				//turn preview layer on
				previewlayers[iconIndex].on = true;
			};
		});
		if (go){ mapPreviewLayers() }; //->
	};

	function resizeMarkers(markerType, init, newlabels){
		//scale preview marker size based on paper size and orientation
		//each circle marker will print at 8 mm diameter regardless of map scale and page size
		var radius = getRadius();

		//change line weights
		previewlayers.forEach(function(layer){
			if (layer.on && layer.lineLayer){
				//iterate over each line to apply individualized stroke widths
				layer.lineLayer.eachLayer(function(elayer){
					var feature = elayer.feature;
					var	tableAtts = tables[feature.tablename].attributes[lang];
					//if line weights are based on an attribute value, use weights stored in tables.json
					if (feature.weight){
						var weightAtt = feature.weight.attribute,
							waValue = feature.properties[weightAtt],
							weightNumber = tableAtts[weightAtt].values[waValue].weight;
						elayer.setStyle({
							weight: weightNumber * radius / 8
						});
					} else {
						//default line weight
						elayer.setStyle({
							weight: 2 * radius / 8
						});
					};
				});
			};
		});

		//each icon will print at 8 mm per side regardless of map scale and page size
		var side = 2 * radius;
        var ratio = side / 30;
        
        var setScaleTransform = function(existing){
            var translate = existing.substring(0, existing.indexOf(')')+1);
            return translate +" scale("+ratio+")";
        }

		//need to change dimensions and offset
		$.each($("#printPreview .leaflet-marker-icon"), function(index, value){
            $(this).css({
                transform: function(){return setScaleTransform($(this).prop('style').transform)},
		      });
        });
		//adjust north arrow
		$(".northArrow img").css({
			width: side + "px",
			height: side + "px"
		});
		$(".northArrow").css({
			"margin-right": side / 4,
			"margin-top": side / 4
		});
        
		$("#printBox .leaflet-control-scale-line").css({
			"font-size": (side / 3.5) + "px"
		});
        
        //adjust agis logo
		$(".printcomponent img").css({
			height: side + "px"
		});
		$(".printcomponent").css({
			"margin-right": side / 4,
			"margin-top": side / 4
		});
        
		$(".printcomponent .legend .clickable").children().css({
			width: side*.5 + "px",
			height: side*.5 + "px"
		});
        
		$(".printcomponent p.disclaimer").css({
			"font-size": (side*.2) + "px"
		});
        
		$(".printcomponent .featurebutton").css({
			width: side*.6 + "px",
			height: side*.6 + "px",
            "background-size": side*.6 + "px "+ side*.6 + "px" 
		});
        
        $(".printcomponent .legend").css({
			"font-size": (side*.2) + "px",
            "padding": (side / 4) + "px"
        });
		$(".printcomponent h3").css({
			"font-size": (side*.3) + "px",
            "margin-left": side*.5,
            "margin-bottom": side*.2,
        });
        
		$(".printcomponent h1").css({
			"margin-top": side + 5,
            "background": "rgba(128, 128, 128, 0.49)",
            "padding": "0 "+side/2+"px",
            "font-size": side*.55+"pt",
            "color": "white"
		});
        
		$("#printPreview .leaflet-label").css({
			"font-size": (side*.2) + "px"
		});
	};

	function getRadius(){
		//adjust ratio scale and return scale ratios
		var scales = adjustScale();
		var mmppPaper = scales[1];
		return 4 / mmppPaper;
	};

	function adjustPreviewBox(){
		//<-printMap
		//set preview box dimensions based on print window size and paper orientation
		var height, width;
		if ($("#paperOrientation option[value=portrait]").prop("selected")){
			height = $("#printBox").height() - 61;
			width = height / Math.sqrt(2);
		} else {
			//first set by horizontal dimension
			width = $("#printBox").width() - 300;
			height = width / Math.sqrt(2);
			//check for vertical overflow
			if (height > $("#printBox").height() - 61){
				height = $("#printBox").height() - 61;
				width = height * Math.sqrt(2);
			};
		};
		$("#printPreview").height(height);
		$("#printPreview").width(width);

		if (typeof printPreviewMap != 'undefined'){
			printPreviewMap.invalidateSize(false);
		};
	};

	function adjustScale(){
		//change symbol sizes and ratio scale according to paper size
		var prevWidth = $("#printPreview").width();
		var prevHeight = $("#printPreview").height();
	    var longside = getLongside();
			 
		//find the mm per pixel ratio
		var mmppPaper = prevWidth > prevHeight ? longside / prevWidth : longside / prevHeight;
		var mapZoom = printPreviewMap.getZoom();
		var scaleText = $("#printBox .leaflet-control-scale-line").html().split(" ");
		var multiplier = scaleText[1] == "km" ? 1000000 : 1000;
		var scalemm = Number(scaleText[0]) * multiplier;
		var scalepx = Number($("#printBox .leaflet-control-scale-line").width());
		var mmppMap = scalemm / scalepx;
		var denominator = Math.round(mmppMap / mmppPaper);
		$("#ratioScale span").text(denominator);
		$("#previewLoading").hide();
		return [mmppMap, mmppPaper];
	};

	function getLongside(){
	    //get longside in mm minus print margins
	    var size = $("#paperSize select option:selected").val();
		var series = size[0];
		var pScale = Number(size[1]);
		var longside;
		if (series == "A"){ //equations for long side lengths in mm, minus 10mm print margins
			longside = Math.floor(1000/(Math.pow(2,(2*pScale-1)/4)) + 0.2) - 20;
		} else if (series == "B"){
			longside = Math.floor(1000/(Math.pow(2,(pScale-1)/2)) + 0.2) - 20;
		};
	    return longside;
	};
    
    function buildLegend(){
        var features = $('#featuregrid tr:has(input:checked):not(:has(span.detail:empty))').clone();
        if (features.length < 1){
            return;
        }
        features.children().remove('td:has(input)');
        features.find('span.detail').remove();
        return $($('<div class="legend"/>').append("<h3>LEGEND</h3>")).append($('<table>').append(features));
    };
};

$(document).ready(initialize);

