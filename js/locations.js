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
                var geojsonLayer = L.geoJson(data.val(), overlay.style);
                LayersControl.addOverlay(geojsonLayer, overlay.name);
                if (overlay.default) { // Set default for the overlay
                    map.addLayer(geojsonLayer);
                }
            })
        } else if (overlay.tilesURL) { // we have a tile overlay to add
            var tilelayer = L.tileLayer(overlay.tilesURL, overlay.options);
            LayersControl.addOverlay(tilelayer, overlay.name);
            if (overlay.default) { // Set default for the overlay
                map.addLayer(tilelayer);
            }
        }
    });
}

function extendBounds(latlngBounds, amount){
    //extend top left
    var topLeft =[parseFloat(latlngBounds[0][0])-amount, parseFloat(latlngBounds[0][1])-amount];
    var bottomRight = [parseFloat(latlngBounds[1][0])+amount, parseFloat(latlngBounds[1][1])+amount];
    return [topLeft, bottomRight];
    
}

function setBounds(latlongBounds){
    if (latlongBounds){
        map.setMaxBounds(extendBounds(latlongBounds, 0.1));
        map.fitBounds(latlongBounds, {animate: true});
    } else { // reset all
        map.panTo(AucklandLatLng, {animate: true});
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
function loadLocationsGeoJSON(editID){
    // load geojson into featureGroups
    if (undefined == editID){
        console.log("No GeoJSON found for this location");
        $('#cover').hide();
        return;
    }
    rootRef.ref("edit/"+locationID+"/"+editID+"/geojsonid/").once('value', function(data) {
        rootRef.ref("geojson/"+data.val()).once('value', function(json){
            geojsons = json.val();
            try {
                $('#cover').show(); // ensures this remains shown during loading
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
                            snapguides.push(layer); // add to snap-guides
                        } else {
                            if (feature.properties && feature.properties.LeafType){
                                console.log("GeoJSON contained unknown feature: "+feature.properties.LeafType);
                            } else {
                                console.log("GeoJSON contained malformed feature: "+JSON.stringify(feature));
                            }
                        }
                    }
                });
            } finally {
                $('#cover').hide();
            }
      });
    });
}

function loadEditHistory(data, currentedit, specificVersion){
//    clearEditHistory();
    $('#historylist').html(""); // clear the contents
    var edits = data.val();
    if (edits == undefined){
        return;
    }
//    edits = $(edits).children().get().reverse();
    $('#historylist').append('<h3>Edit History</h3>');
    var div = document.createElement('div');
    div.className = "accordion accordionDiv";
//    $(div).append('<h3>'+childSnapshot.key+'</h3>');
    var html = '<table class="historyTable w3-table w3-bordered w3-hoverable w3-small"><thead><tr></tr></thead><tbody>';
    // add edits to Edit list
    var users = []; // List of userIDs in the list
    $.each(edits, function(index, element){
        timestamp = Number(element.datetime);
        date = element.datetime ? new Date(timestamp).toLocaleDateString('en-NZ') : '---';
        if ((index == currentedit && !specificVersion) || index == specificVersion){
            html += '<tr class="current" data=\''+index+'\'>';
        } else {
            html += '<tr data=\''+index+'\'>';
        }
        html += '<td class="details" onclick="loadEdit(\''+index+'\')"><span>'+date+'</span><br/><span data=\''+element.user+'\'></span></td>';
        if (element.note) {
            html += '<td class="note" title="'+element.note+'"><p class="fadeouttext">'+truncate.apply(element.note, [90, true])+'</p></td>';
        } else {
            html += '<td class="note w3-text-grey">---</td>';
        }
        
        if ( users.indexOf(element.user) == -1 ) users.push(element.user);
        if (editsEnabled){ // only show delete/protected if user is able to edit
            html += '<td class="delete"><span class="w3-right ';
            if (element.protected || index == currentedit){
                html += 'w3-text-grey">Protected</span></td>';
            } else {
                html += 'clickable w3-text-red" onclick="deleteEdit('+locationID+',\''+index+'\')"><b>Delete</b></span>';
            }
            html += '</td>';
        }
        html += "</tr>";
    });
    $.each(users, function(index, element){
        // Get username of each user and set it
        rootRef.ref("/user/"+element).once('value', function(data){
            userData = data.val();
            if(userData && userData.name){
                $('.historyTable span[data="'+data.key+'"]').html(userData.name);
            }
        });
    });
    html += '</tbody></table>';
    $(html).appendTo($(div));
    $(div).appendTo('#historylist');
    $('#historylist').accordion(accordionOptions);
    $('#historylist').accordion("refresh" );
    if (specificVersion){ // we want to keep list expanded after making selection
        // hacky way to make the accordion expand - set it to uncollapsible momentarily.
        $('#historylist').accordion( "option", "collapsible", false );
        $('#historylist').accordion( "option", "collapsible", true );
    }
}

function removeEdit(data){
    $('.historyTable tr[data="'+data.key+'"]').remove();
}

function loadEdit(editKey){
    if (confirm("Load this map version? Any unsaved changes will be lost")){
        locationSwitch(document.getElementById('location'), editKey);
    }
}

function locationSwitch(sel, specificVersion){
    $('#cover').show();
    removeDrawControl();
    editingFeature = ""; // fiddly state change of drawcontrol editing.
    resetLayers();
    labels = new L.LayerGroup();
    map.addLayer(labels);

    locationID = sel.value;
    
    populateFeatureGrid();
    
    // Temporary/hardcoded/very-bad-way to set the banner based on location id
    if (parseInt(locationID) <= 10 || (parseInt(locationID) > 12 && parseInt(locationID) < 23)){
        $('#banner').html("<img class=\"w3-left logo\" src=\"images/ac_web_app_log.png\">");
    } else {
        $('#banner').html("<img title='Your Logo' class=\"w3-left logo\" src=\"images/agis_banner_logo.png\">");
    }
    
    locRef = rootRef.ref("/location/"+locationID);
    if (specificVersion){ // loading a previous edit
        locRef.child('currentEdit').once("value", function(data) {
            loadLocationsGeoJSON(specificVersion);
            rootRef.ref("/edit/"+locationID).orderByChild('datetime').once("value", function(editHistory){
                    loadEditHistory(editHistory, data.val(), specificVersion);
            });
        });
    } else {
        locRef.child('currentEdit').once("value", function(data) {
            loadLocationsGeoJSON(data.val());
            rootRef.ref("/edit/"+locationID).orderByChild('datetime').once("value", function(editHistory){
                    loadEditHistory(editHistory, data.val());
            });
        });
    }
    locRef.child('overlays').once("value", function(data){
        loadOverlays(data);
    });
    locRef.child('bounds').once("value", function(data){
        setBounds(data.val());
    });
    locRef.child('name').once("value", function(data){
        $('#banner').html($('#banner').html() + "<span id='maptitle'>"+data.val()+"</span>");
    });
    rootRef.ref("/edit/"+locationID).on("child_removed", function(data){
        removeEdit(data);
    });
}
