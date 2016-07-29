// remove all overlays from LayersControl (keeping basemaps);
function clearOverlays(){
    $.each(LayersControl._layers, function(index, layerEntry){
        if (layerEntry.overlay){
            map.removeLayer(layerEntry.layer); // remove from map, if displayed
            LayersControl.removeLayer(layerEntry.layer); // remove from LayersControl
        }
    });
}

//Loads the overlays which are defined in the database
function loadOverlays(overlayRef){
    clearOverlays();
    
    // Add LINZ property boundaries Overlay
    tilelayer = L.tileLayer('http://tiles-a.data-cdn.linz.govt.nz/services;key=780af066229e4b63a8f9408cc13c31e8/tiles/v4/set=69/EPSG:3857/{z}/{x}/{y}.png', {attribution: "LINZ Property Parcel Boundaries"});
    LayersControl.addOverlay(tilelayer, "Property Boundaries (LINZ)");
    
    newOverlays = overlayRef.val();
    if (undefined == overlayRef.val()){
        console.log("No overlays found for this location");
        return;
    }
    
    // add each overlay to LayersControl
    $.each(newOverlays, function(index, overlay){
        if (overlay.geojsonid) { // we have a geojson overlay to add
            rootRef.ref('geojson/'+overlay.geojsonid).once('value', function(data){
                geojsonLayer = L.geoJson(data.val(), overlay.style);
                LayersControl.addOverlay(geojsonLayer, overlay.name);
            })
        } else if (overlay.tilesURL) { // we have a tile overlay to add
            tilelayer = L.tileLayer(overlay.tilesURL, overlay.options);
            LayersControl.addOverlay(tilelayer, overlay.name);
            if (overlay.default) { // Set default for the overlay
                map.addLayer(tilelayer);
            }
        }
    });
}

function setBounds(latlongBounds){
    if (latlongBounds){
        map.panTo(getCentreOfLatlngs(latlongBounds), {animate: true});
        map.setMaxBounds(latlongBounds);
        map.options.minZoom = 14;
        map.setZoom(14);
    } else { // reset all
        map.panTo(AucklandLatLng, {animate: true});
        map.setMaxBounds(null);
        map.options.minZoom = null;
        map.setZoom(9);
    }
//    addPropertyBoundariesOverlay(getCentreOfLatlngs(latlongBounds)); // No longer using this service -- using a WMTS service now
}

function getCentreOfLatlngs(latlngs){
    x = 0;
    y = 0;
    for (i = 0; i < latlngs.length; i++){
        x += latlngs[i][0];
        y += latlngs[i][1];
    }
    return [x/i, y/i];
}

var editingFeature = null; // the feature currently selected for editing
//Loads up the GeoJSON into leaflet layers
function loadLocationsGeoJSON(data){
    // load geojson into featureGroups
    var editID = data.val();
    if (undefined == editID){
//        alert("No data found for this location");
        return;
    }
    rootRef.ref("edit/"+locationID+"/"+editID+"/geojsonid/").once('value', function(data) {
        rootRef.ref("geojson/"+data.val()).once('value', function(json){
            geojsons = json.val();
            L.geoJson(geojsons, {
                onEachFeature: function (feature, layer) {
                    layer.on('click', function(e){
                        setEditLayer(e);
                    });
                    layer.properties = feature.properties;
                    if (feature.properties != undefined && feature.properties.LeafType != undefined && Feature[feature.properties.LeafType]){// Skip features not in our Feature-definitions
                        if (layer.options == undefined) { layer.options = {}; }
                        $.extend(layer.options, Feature[feature.properties.LeafType].options); // Add symbology to the feature
                        if (layer.feature.geometry.type == "Point") {
                            layer.options.icon = L.icon(Feature[feature.properties.LeafType].options.icon);
                        }
                        if (featureGroups[feature.properties.LeafType]) { // check that the featureGroup exists
                            featureGroups[feature.properties.LeafType].addLayer(layer);
                        }
                        map.addLayer(layer);
                        addLabelsToFeature(layer, layer.properties.LeafLabel, layer.properties.details);
                    } else {
                        if (feature.properties && feature.properties.LeafType){
                            console.log("GeoJSON contained unknown feature: "+feature.properties.LeafType);
                        } else {
                            console.log("GeoJSON contained malformed feature: "+JSON.stringify(feature));
                        }
                    }
                }
            });
      });
    });
}

function loadEditHistory(data, currentedit){
//    clearEditHistory();
    $('#historylist').html(""); // clear the contents
    edits = data.val();
    if (edits == undefined){
        return;
    }
    $('#historylist').append('<h3>Edit History</h3>');
    var div = document.createElement('div');
    div.className = "accordion accordionDiv";
//    $(div).append('<h3>'+childSnapshot.key+'</h3>');
    var html = '<table class="historyTable"><thead><tr></tr></thead><tbody>';
    // add edits to Edit list
    var users = []; // List of userIDs in the list
    $.each(edits, function(index, element){
        timestamp = Number(element.datetime);
        date = new Date(timestamp) || new Date(element.datetime);
        html += '<tr data=\''+index+'\'>';
        html += '<td onclick="loadEdit(\''+index+'\')">'+date.toLocaleDateString('en-NZ')+'</td>';
        html += '<td data=\''+element.user+'\'></td>';
        if ( users.indexOf(element.user) == -1 ) users.push(element.user);
        if (element.protected || index == currentedit){
            html += '<td>Protected</td>';
        } else {
            html += '<td class="clickable" onclick="deleteEdit('+locationID+',\''+index+'\')"><b>Delete</b></td>';
        }
        html += "</tr>";
    });
    $.each(users, function(index, element){
        // Get username of each user and set it
        rootRef.ref("/user/"+element).once('value', function(data){
            userData = data.val();
            if(userData && userData.name){
                $('.historyTable td[data="'+data.key+'"]').html(userDate.name);
            }
        });
    });
    html += '</tbody></table>';
    $(html).appendTo($(div));
    $(div).appendTo('#historylist');
    $('#historylist').accordion(accordionOptions);
    $('#historylist').accordion("refresh" );
}

function removeEdit(data){
    $('.historyTable tr[data="'+data.key+'"]').remove();
}

function locationSwitch(sel){
    removeDrawControl();
    editingFeature = ""; // fiddly state change of drawcontrol editing.
    resetLayers();
    labels = new L.LayerGroup();
    map.addLayer(labels);

    locationID = sel.value;
    
    // Temporary/hardcoded/very bad way to set the banner based on location
    if (parseInt(locationID) <= 10){
        $('#banner').html("<img class=\"w3-left logo\" src=\"images/ac_web_app_log.png\">");
    } else {
        $('#banner').html("");
    }    
    
    locRef = rootRef.ref("/location/"+locationID);
    locRef.child('currentEdit').once("value", function(data) {
        loadLocationsGeoJSON(data);
        rootRef.ref("/edit/"+locationID).orderByChild('datetime').once("value", function(editHistory){
                loadEditHistory(editHistory, data.val());
        });
    });
    locRef.child('overlays').once("value", function(data){
        loadOverlays(data);
    });
    locRef.child('bounds').once("value", function(data){
        setBounds(data.val());
    });
    locRef.child('name').once("value", function(data){
        $('#banner').html($('#banner').html() + "<h1>"+data.val()+"</h1>");
    });
    rootRef.ref("/edit/"+locationID).on("child_removed", function(data){
        removeEdit(data);
    });
}
