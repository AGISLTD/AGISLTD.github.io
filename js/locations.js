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
function loadOverlays(overlayRef, centrePoint){
    clearOverlays();
    newOverlays = overlayRef.val();
    if (undefined == overlayRef.val()){
        alert("No overlays found for this location");
        return;
    }
    // add overlay to LayersControl
    $.each(newOverlays, function(index, overlay){
        tilelayer = L.tileLayer(overlay.tilesURL, overlay.options);
        LayersControl.addOverlay(tilelayer, overlay.name);
        if (index == 0) { //always add the first overlay
            map.addLayer(tilelayer);
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
    addPropertyBoundariesOverlay(getCentreOfLatlngs(latlongBounds));
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

//Loads up the GeoJSON into leaflet layers
function loadLocationsGeoJSON(data){
    // load geojson into featureGroups
    var editID = data.val();
    if (undefined == editID){
        alert("No data found for this location");
        return;
    }
    rootRef.ref("edit/"+locationID+"/"+editID+"/geojsonid/").once('value', function(data) {
        rootRef.ref("geojson/"+data.val()).once('value', function(json){
            geojsons = json.val();
            L.geoJson(geojsons, {
                        onEachFeature: function (feature, layer) {
                            layer.properties = feature.properties;
                            if (feature.properties != undefined && feature.properties.LeafType != undefined && Feature[feature.properties.LeafType]){// Skip features not in our Feature-definitions
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
                                console.log("GeoJSON contained unknown feature: "+JSON.stringify(feature));
                            }
                        }
                    });
//                        $.each(geojsons.features, function(index, geojson){
//                            if (geojson.geometry.features){ // don't perform on empty (thus malformed) feature groups
//                                L.geoJson(geojson.geometry, {
//                                    onEachFeature: function (feature, layer) {
//                                        layer.properties = feature.properties;
//                                        if (Feature[feature.properties.type]){// Skip features not in our Feature-definitions
//                                            $.extend(layer.options, Feature[feature.properties.type].options); // Add symbology to the feature
//                                            if (layer.feature.geometry.type == "Point") {
//                                                layer.options.icon = L.icon(Feature[feature.properties.type].options.icon);
//                                            }
//                                            if (featureGroups[feature.properties.type]) { // check that the featureGroup exists
//                                                featureGroups[feature.properties.type].addLayer(layer);
//                                            }
//                                            addLabelsToFeature(layer, layer.properties.name, layer.properties.details);
//                                        } else {
//                                            console.log("GeoJSON contained unknown feature: "+feature.properties.type);
//                                        }
//                                    }
//                                });
//                            }
//                        });
      });
    });
}

function locationSwitch(sel){
    resetLayers();
    labels = new L.LayerGroup();
    map.addLayer(labels);

    locationID = sel.value;
    locRef = rootRef.ref("/location/"+locationID);
    locRef.child('currentEdit').once("value", function(data) {
        loadLocationsGeoJSON(data);
    });
    locRef.child('overlays').once("value", function(data){
        loadOverlays(data);
    });
    locRef.child('bounds').once("value", function(data){
        setBounds(data.val());
    });
}
