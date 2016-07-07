var map;
var drawControl; // Edit/Delete controls
var location;
var AucklandLatLng = [-36.8485, 174.7633];
var labelMarkerDic = {};
$(document).ready(function(){
    $('#Username').keypress(function(e){
              if(e.keyCode==13)
              $('#userLogin').click();
            });
    
    map = L.map('map', {
			center: AucklandLatLng,
			zoom: 10,
			layers: [grayscale]
		});
    
    GeoJSONControl.addTo(map);
    
    // Add relevant data / icons / labels for new feature created
    map.on('draw:created', function (e) {
			var type = e.layerType,
				layer = e.layer;
            
            // Set the relevant symbology based on featureType
			if (type === 'marker') {
                featuretype = layer.options.icon.options.type;
			}
			if (type === 'polygon') {
                featuretype = layer.options.polyType
			}
            if (type === 'polyline') {
                featuretype = layer.options.lineType
            }
        
            // Add to our feature  group
			featureGroups[featuretype].addLayer(layer);
        
            layer.properties = {};
            layer.properties.type = featuretype;
            askForFeatureDetails(layer);
		});
    
    // Delete removes layers from drawnItems - we need to remove them from their featureGroup as well
    map.on('draw:deleted', function(e){
        e.layers.eachLayer(function(layer){
            featureGroups[layer.properties.type].removeLayer(layer);
        });
    });
    
    // Check for corresponding labels to add/remove along with layer being add/removed
    map.on('layeradd', function(e){
        id = e.layer._leaflet_id
        if (labelMarkerDic[id]){
            map.addLayer(labelMarkerDic[id]);
        }
    });
    map.on('layerremove', function(e){
        id = e.layer._leaflet_id
        if (labelMarkerDic[id]){
            map.removeLayer(labelMarkerDic[id]);
        }
    })
    
    //Resize leaflet map dynamically
    var mapmargin = $('#topbar').outerHeight();
    function resize(){
        $('#map').css("height", ($(window).height() - mapmargin));    
        $('#map').css("margin-top",mapmargin);
    }
    $(window).on("resize", resize);
    resize();
    
    LayersControl.addTo(map);
});

// Bind UI
$('.accordion').accordion();

// Asks user for details about the Feature they just added
function askForFeatureDetails(layer) {
    var detailsPopup = L.popup();
    var content = '<span><b>Label</b></span><br/><input id="shapeName" type="text" placeholder="eg \''+layer.properties.type.toUpperCase()+'\'"/><br/><br/><span><b>Details<b/></span><br/><textarea id="shapeDesc" cols="25" rows="5"></textarea><br/><br/><input type="submit" id="okBtn" value="Save" onclick="saveFeatureDetails(\''+layer.properties.type+'\','+layer._leaflet_id+')"/>';
    detailsPopup.setContent(content);
    detailsPopup.setLatLng(getLatLng(layer)); //calculated based on the e.layertype
    detailsPopup.openOn(map);
}

// Returns 'middle' latlng for a given feature
function getLatLng(feature) {
    if (feature._latlng) {
        return feature._latlng; // Markers have just one latlng
    }
    else if (feature._latlngs){
        return feature.getBounds().getCenter();
    }
}

// Save name/details for the current feature. 
function saveFeatureDetails(featureType, featureID) {
    if (featureGroups[featureType]){
        feature = featureGroups[featureType].getLayer(featureID); // retrieve the layer just created
        var sName = document.getElementById("shapeName").value;
        var sDetails = document.getElementById("shapeDesc").value;
     //drawnItems is a container for the drawn objects
        feature.properties.name = sName;
        feature.properties.details = sDetails;
        addLabelsToFeature(feature, sName, sDetails);
    }
    map.closePopup();
}

function addLabelsToFeature(feature, labeltext, details){
    // add the details popup
    if (details) {
        feature.bindPopup(details);
    }
    
    // add the overlay label
    if (labeltext) {
        if (feature._latlng){ // hacky way to check if it's a point marker, rather than line or poly
            feature.bindLabel(labeltext, { noHide: true, className: 'markerLabel' });
            feature.showLabel();
        } else {
            var latlng, classname;
            if (feature.options.polyType) {
                latlng = getLatLng(feature);
                classname = "polyLabel";
            }
            if (feature.options.lineType)  {
                latlng = feature._latlngs[0];
                classname = "lineLabel";
            }
            // create a 'ghost marker' to bind the label to
            var marker = new L.marker(latlng, { opacity: 0.01, draggable: true, icon: L.divIcon({className: 'labelDragHandle', iconAnchor: [0,0]}) });
            marker.bindLabel(labeltext, {noHide: true, className: classname, offset: [-20, -15] });
            labels.addLayer(marker);
            labelMarkerDic[feature._leaflet_id] = marker;
            //labels.addTo(map);
            marker.showLabel();
        }
    }
}


// GeoJSON save / show controls
var GeoJSONControl = L.control({
            position: 'topleft'});
GeoJSONControl.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'customC'); // Creates our div with class "customC"
    this._div.innerHTML = '<button id="savebutton" onclick="saveGeoJson()">Save</button>';
    return this._div;
};

// Base Maps
var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    mbUrl = 'https://api.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw',
    linzUrl = 'http://tiles-a.data-cdn.linz.govt.nz/services;key=780af066229e4b63a8f9408cc13c31e8/tiles/v4/set=2/EPSG:3857/{z}/{x}/{y}.png';
var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr, base:true}),
    linz = L.tileLayer(linzUrl, {attribution: "LINZ Aerial Photography", base:true});
var baseLayers = {
    "Grayscale": grayscale,
    "LINZ": linz
};

var LayersControl = L.control.layers(baseLayers, {}, {
            position: 'topleft'});

function registerDrawControl(fGroup){
    drawControl = new L.Control.Draw({
        position: 'topleft',
        draw: {
            polygon: false,
            polyline: false,
            rectangle: false,
            circle: false,
            marker: false,
            square: false
        },
        edit: {
            featureGroup: fGroup
        }
    });
    map.addControl(drawControl);
}


// Populates the Location selector
function populateLocations(){
    // clear the contents and add placeholder
    $('#location').html(""); 
    $('#location').append('<option value="" disabled="" selected="">Select Location</option>');
    
    // add option for each location
    locationsRef = rootRef.ref("/location/");
    locationsRef.once('value', function (locationSnapshot) {
        locations = locationSnapshot.val();
        $.each(locations, function(index, element){
            $('#location').append('<option value='+index+'>'+element.name+'</option>');
        });
    });
}

// Feature Layers
var featureGroups = {}; 
var drawnItems = new L.FeatureGroup(); // parent feature group used to generate the geojson
var labels = new L.LayerGroup(); // display layer only - of labels for polylines and polygons

// Resets all feature information. Called on login/logout location switch.
function resetLayers(){
    // Clear all layers off the map
//    map.eachLayer(function(layer){
//        if (!(layer.options && layer.options.base)){
//            map.removeLayer(layer);
//        }
//    });
    drawnItems.clearLayers();
    labels.clearLayers();
    clearOverlays();
    // Reset feature groups to empty groups
    labels = new L.LayerGroup();
    $.each(featureGroups, function(index, element){ // Create a FeatureGroup for each type of Feature
        featureGroups[index] = new L.FeatureGroup();
    });
    // Add the FeatureGroups to parent FeatureGroup (drawnItems)
    addFeatureGroupsToParentGroup();
    // Add back to map
    map.addLayer(drawnItems);
    map.addLayer(labels);
}

function addFeatureGroupsToParentGroup(){
    drawnItems.clearLayers();
    $.each(featureGroups, function(index, element){
        drawnItems.addLayer(element); // add the layer to the parent layergroup
    });
}

//Retrieves features from db and populates the view
function populateFeatureGrid(){
    $('#featuregrid').html(""); // clear the contents
    featureRef = rootRef.ref("/features/");
    featureRef.on('child_added', function (featureSnapshot) {
        // Will be called with a featureSnapshot for each child under the /features/ node
        $('#featuregrid').append('<h3>'+featureSnapshot.key +'</h3>');
        var html = '<table><thead><tr></tr></thead><tbody>';
        $.each(featureSnapshot.val(), function(index, element){
//            row = document.createElement("tr");
            featureGroups[element.name] = new L.FeatureGroup(); // Create our categorised featurelayer reference
//            $(row).append('<td style="background-img:url(\''+element.options.icon.iconURL+'\')" onclick="addFeature(\''+element.name+'\')">'+element.description+'</td><td><input featuretype='+element.name+' class="showLayer" type="checkbox" checked></td>');
            Feature[element.name] = element; // save symbology for this feature type
            
                html += '<tr>';
                if (element.options && element.options.icon){
                    html += '<td class="buttontable" style="background-image:url(\''+element.options.icon.iconUrl+'\')"';
                }else {
                    html+= '<td '//no icon img for background
                }
                html += 'onclick="addFeature(\''+element.name+'\')">+</td>';
                html += '<td>' + element.description + '</td>';
                html += '<td><input featuretype='+element.name+' class="showLayer" type="checkbox" checked></td>';
                html += "</tr>";
        });
        html += '</tbody></table>';
        $(html).appendTo('#featuregrid');
        addFeatureGroupsToParentGroup();
        
        // add show/hide functionality to the checkboxes we added
        $('input[type=checkbox].showLayer').change(
        function(){
            //event.preventDefault();
            layer = featureGroups[$(this).attr('featuretype')];
            if(this.checked) {
                map.addLayer(layer);
            } else {
                if (map.hasLayer(layer)){
                    map.removeLayer(layer);
                }
           }
        });
        
        //accordionise our new feature menu grid thing
    $('#featuregrid').accordion();
    $('#featuregrid').accordion("refresh" );
        
    }, function (err) {
      // code to handle read error
    });
}


function userLogin() {
    firebase.auth().signInWithEmailAndPassword($("#email").val(), $("#password").val()).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      alert("Failed to log in: "+errorMessage)
      return;
    }).then(function(user){
        userSwitch(user.uid);
        populateFeatureGrid();
        populateLocations();
        registerDrawControl(drawnItems);
    });
    
    firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        $( "#dialog-login" ).dialog("close");
        $('#userLoginContainer').hide();
        $('#fbName').text(user.email);
        $('#logindeetz').show();
    } else {
        $('#userLoginContainer').show();
        $('#logindeetz').hide();
        resetLayers();
        $( "#dialog-login" ).dialog("open");
    }
    });
}

function logout(){
    if (drawControl._map) { // http://stackoverflow.com/questions/33146809/find-out-if-a-leaflet-control-has-already-been-added-to-the-map
        map.removeControl(drawControl);
    }
    resetLayers();
    firebase.auth().signOut().then(function() {
        $('#logindeetz').hide();
          $('#fbName').text("");
          $('#userLoginContainer').show();
        userSwitch(-1);
        $('#featuregrid').removeData(); // clear the contents
        $('#featuregrid').html(""); // clear the contents
    }, function(error) {
      alert("Failed to sign out..");
    });
}


function userSwitch(val) {      
    
    if (val == -1) {//logout
        resetLayers();
        userRef = null;
        return;
    }

    // set userRef
    userRef = rootRef.ref("/user/"+val);
}