var map;
var drawControl; // Edit/Delete controls
var location;
var drawControl;
var currentlyEditing = false; // flag to indicate state of drawControl
var editingFeature = null; // the feature currently selected for editing
var uid = null;
var AucklandLatLng = [-36.8485, 174.7633];
var labelMarkerDic = {};
var accordionOptions = {active: false, collapsible: true,animate: false,heightStyle: "content"};
var iconSize = {
    small: [16, 16],
    normal: [28, 28],
    medium: [28, 28],
    large: [32, 32],
    xlarge: [48, 48],
    xxlarge: [128, 128],
    massive: [164, 164],
};
//var location = require("location");
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
        
            // Add layer to our feature  group
			featureGroups[featuretype].addLayer(layer);
        
            layer.properties = {};
            layer.properties.LeafType = featuretype;
            askForFeatureDetails(layer);
            layer.on('click', function(e){
                setEditLayer(e);
            });
    });
    
    map.on('draw:deletestart', function(e){
        currentlyEditing = true;
    });
    map.on('draw:editstart', function(e){
        currentlyEditing = true;
    });
    map.on('draw:editstop', function(e){
        currentlyEditing = false;
//        TODO -- if "canceled" revert changes to drawnItems also
    });
    map.on('draw:deletestop', function(e){
        currentlyEditing = false;
//        TODO -- if "canceled" revert changes to drawnItems also
    });
    
    // Delete removes layers from drawnItems - we need to remove them from their featureGroup as well
    map.on('draw:deleted', function(e){
        e.layers.eachLayer(function(layer){
            featureGroups[layer.properties.LeafType].removeLayer(layer);
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
    window.dispatchEvent(new Event('resize'));
    
    LayersControl.addTo(map);
});
//
//// Bind UI
//$('.accordion').accordion(accordionOptions);

// Asks user for details about the Feature they just added
function askForFeatureDetails(layer) {
    var detailsPopup = L.popup();
    var content = '<span><b>Label</b></span><br/><input id="shapeName" type="text" placeholder="eg \''+layer.properties.LeafType+'\'"/><br/><br/><span><b>Details<b/></span><br/><textarea id="shapeDesc" cols="25" rows="5"></textarea><br/><br/><input type="submit" id="okBtn" value="Save" onclick="saveFeatureDetails(\''+layer.properties.LeafType+'\','+layer._leaflet_id+')"/>';
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
        feature.properties.LeafLabel = sName;
        feature.properties.LeafDetails = sDetails;
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
var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr, base:true, maxZoom: 20}),
    linz = L.tileLayer(linzUrl, {attribution: "LINZ Aerial Photography", base:true, maxZoom: 20});
var baseLayers = {
    "Grayscale": grayscale,
    "LINZ Aerial": linz,
//    "No basemap": null
};

var LayersControl = L.control.layers(baseLayers, {}, {
            position: 'topleft'});

// Registers the DrawControl to the layer that was clicked
function setEditLayer(e){
    if(editingFeature === e.target.properties.LeafType || currentlyEditing){
       return;
    }
    editingFeature = e.target.properties.LeafType;
    registerDrawControl(featureGroups[e.target.properties.LeafType], e.target.properties.LeafType);
}

// Registers drawControl (for edits) to the given featureGroup
function registerDrawControl(fGroup, type){
    removeDrawControl();
    
    // Add drawcontrol
    drawControl = new L.Control.Draw({
        position: 'topleft',
        draw: false, // Don't want Leaflet Draw's draw toolbar
        edit: {
            featureGroup: fGroup
        }
    });
    map.addControl(drawControl);
    
    // Customize the text of the drawControl
    if (type){
        L.drawLocal.edit.toolbar.actions.save.title = "Confirm changes";
        L.drawLocal.edit.toolbar.actions.save.text = "Confirm";
        L.drawLocal.edit.toolbar.buttons.edit = "Edit "+type+" features";
        L.drawLocal.edit.toolbar.buttons.edit = "Edit "+type+" features";
        L.drawLocal.edit.toolbar.buttons.editDisabled = "No "+type+" features to edit";
        L.drawLocal.edit.toolbar.buttons.remove = "Remove "+type+" features";
        L.drawLocal.edit.toolbar.buttons.removeDisabled = "No "+type+" features to remove.";
        L.drawLocal.edit.handlers.remove.tooltip.text = "Click a "+type+" feature to remove it.";
        
        // Add messagebox to indicate to user
        var box = L.control.messagebox({position: 'topleft', timeout: '2000'}).addTo(map);
        box.show('Edit controls switched to '+type+' features.');
    }
}

function removeDrawControl(){
    currentlyEditing = false;
    if (drawControl && drawControl._map){ // remove exisiting drawcontrol.
        map.removeControl(drawControl);
    }
}

// Populates the Location selector
function populateLocations(){
    // clear the contents and add placeholder
    $('#location').html(""); 
    $('#location').append('<option value="" disabled="" selected="">Select Location</option>');
    
    // add option for each location
    locationsRef = rootRef.ref("/location/");
    viewableLocsRed = rootRef.ref("/roles/"+uid+"/view/");
    viewableLocsRed.on('child_added', function (element) {
        locationsRef.child(element.key).once("value", function(loc){
            $('#location').append('<option value='+loc.key+'>'+loc.val().name+'</option>');
            $('#mapControls').show();
        })
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
//        featureGroups[index] = L.featureGroup.subGroup(drawnItems);
        map.addLayer(featureGroups[index]);
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
        $('#featuregrid').append('<h3>'+featureSnapshot.val().name +'</h3>');
        var div = document.createElement('div');
        div.className = "accordion accordionDiv";
        featureSnapshot.forEach(function(childSnapshot){
            featureArray = childSnapshot.val();
            if ($.isArray(featureArray)){
                $(div).append('<h3>'+childSnapshot.key +'</h3>');
                var html = '<table class="featureTable"><thead><tr></tr></thead><tbody>';
                $.each(featureArray, function(index, element){
        //            row = document.createElement("tr");
                    featureGroups[element.name] = new L.FeatureGroup(); // Create our categorised featurelayer reference
                    featureGroups[element.name].addTo(map);
                    Feature[element.name] = element; // save symbology for this feature type

                        html += '<tr>';
                        html += '<td title="Add '+element.description+'" onclick="addFeature(\''+element.name+'\')"'
                        if (element.family == "marker"){
                            // Set icon's size and anchor point
                            element.options.icon.iconSize = iconSize[element.size];
                            element.options.icon.iconAnchor = iconSize[element.size].map(function(obj){
                                return obj / 2; // Icon Anchor is in the middle of the icon.
                            });
                            html +='class="clickable featurebutton" style="background-image:url(\''+element.options.icon.iconUrl+'\')"';
                        }else if (element.family == "polyline") {
                            html+= 'class="clickable"><div class="linefeaturebutton"><div class="line" style="background-color:'+element.options.color+';height:'+element.options.weight+'px;"/></div';
                        }else if (element.family == "polygon") {
                            html+= 'class="clickable"><div class="polyfeaturebutton" style="background-color:'+element.options.fillColor+';border-color:'+element.options.color+'"/';
                        }
                        html += '></td>';
                        html += '<td>' + element.description + '</td>';
                        html += '<td><input featuretype='+element.name+' class="w3-check showLayer" type="checkbox" checked></td>';
                        html += "</tr>";
                });
                html += '</tbody></table>';
                $(html).appendTo($(div));
                $(div).appendTo('#featuregrid');
                $(div).accordion(accordionOptions);
                $(div).accordion("refresh" );
            }
        });
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
    $('#featuregrid').accordion(accordionOptions);
    $('#featuregrid').accordion("refresh" );
        
    }, function (err) {
      // code to handle read error
    });
}

function deleteEdit(location, editKey){
    editRef = rootRef.ref("edit/"+location+"/"+editKey);
    editRef.once("value", function(data){
        jsonRef = rootRef.ref("geojson/"+data.val().geojsonid);
        jsonRef.remove();
    });
    editRef.remove();
//    alert("Deleted edit");
}

function userLogin() {
    var email = $("#email").val();
    if (email.indexOf('@') == -1){ // Not an email address. Assume they're entering a Username only
        email = email+'@agis.co.nz';
    }
    firebase.auth().signInWithEmailAndPassword(email, $("#password").val()).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      alert("Failed to log in: "+errorMessage)
      return;
    }).then(function(user){
        userSwitch(user.uid);
        populateFeatureGrid();
        populateLocations();
    });
    
    firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        $( "#dialog-login" ).dialog("close");
        $('#userLoginContainer').hide();
        $('#fbName').text(user.email);
        $('#userDetails').show();
    } else {
        $('#userLoginContainer').show();
        $('#userDetails').hide();
        $('#mapControls').hide();
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
    uid = val; 
    
    if (val == -1) {//logout
        resetLayers();
        userRef = null;
        return;
    }

    // set userRef
    userRef = rootRef.ref("/user/"+val);
    
    userRef.once('value', function(data){
        if (data.val() && data.val().name){
            $('#fbName').text(data.val().name);
        }
    });
}

// DEPRECATED -- found a WMTS service (NZ Parcel Boundaries Wireframe) to provide same functionality with easier implementation.
// Builds a GeoJSON layer of property title boundaries, from LINZ WFS - adds to Overlay control.
function addPropertyBoundariesOverlay(mapCentre){
// GeoJSON from WFS code (from https://stackoverflow.com/questions/25187937/loading-geojson-layers-from-geoserver-to-leaflet-map-based-on-the-current-boundi)
    var geoJsonUrl = 'http://api.data.linz.govt.nz/api/vectorQuery.json';
    var parameters = {
        key: '780af066229e4b63a8f9408cc13c31e8',
        layer: '804',
        x: mapCentre[1],
        y: mapCentre[0],
        radius: 10000,
        max_results: '100',
        geometry: 'true',
        with_field_names: 'true'
    };
    
    var boundaryStyle = {color: 'black', fillOpacity: '0'}; // Style options applied to the boundary geojson

    $.ajax({
        url: geoJsonUrl + L.Util.getParamString(parameters),
//        url: 'http://api.data.linz.govt.nz/api/vectorQuery.json?key=780af066229e4b63a8f9408cc13c31e8&layer=804&x=175.13902664162185&y=-37.80180293956146&max_results=3&radius=10000&geometry=true&with_field_names=true',
        datatype: 'jsonp',
        jsonCallback: 'getJson',
        success: function(data){
            var geojsonBoundariesLayer = new L.GeoJSON(data.vectorQuery.layers[804], boundaryStyle);
            geojsonBoundariesLayer.getAttribution = function() { return 'LINZ Property Parcels'; };
            LayersControl.addOverlay(geojsonBoundariesLayer, "Property Title Boundaries");
        }
        });
}