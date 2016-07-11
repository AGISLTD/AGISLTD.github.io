// remove all overlays from LayersControl (keeping basemaps);
function clearOverlays(){
    $.each(LayersControl._layers, function(index, layerEntry){
        if (layerEntry.overlay){
            map.removeLayer(layerEntry.layer); // remove from map, if displayed
            LayersControl.removeLayer(layerEntry.layer); // remove from LayersControl
        }
    });
}
function loadOverlays(overlayRef){
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
        

    function locationSwitch(sel){
        resetLayers();
        labels = new L.LayerGroup();
        map.addLayer(labels);
        
        locationID = sel.value;
        locRef = rootRef.ref("/location/"+locationID);
        locRef.child('currentEdit').once("value", function(data) {
            // load geojson into featureGroups
            var editID = data.val();
            if (undefined != editID){
                rootRef.ref("edit/"+locationID+"/"+editID+"/geojsonid/").once('value', function(data) {
                    rootRef.ref("geojson/"+data.val()).once('value', function(json){
                        geojsons = json.val();
                        $.each(geojsons.features, function(index, geojson){
                            if (geojson.geometry.features){ // don't perform on empty (thus malformed) feature groups
                                L.geoJson(geojson.geometry, {
                                    onEachFeature: function (feature, layer) {
                                        layer.properties = feature.properties;
                                        if (Feature[feature.properties.type]){// Skip features not in our Feature-definitions
                                            $.extend(layer.options, Feature[feature.properties.type].options); // Add symbology to the feature
                                            if (layer.feature.geometry.type == "Point") {
                                                layer.options.icon = L.icon(Feature[feature.properties.type].options.icon);
                                            }
                                            if (featureGroups[feature.properties.type]) { // check that the featureGroup exists
                                                featureGroups[feature.properties.type].addLayer(layer);
                                            }
                                            addLabelsToFeature(layer, layer.properties.name, layer.properties.details);
                                        } else {
                                            console.log("GeoJSON contained unkown feature: "+feature.properties.type);
                                        }
                                    }
                                });
                            }
                        });
                  });
                });
            } else {
                alert("No data found for this location");
            }
        });
        locRef.child('overlays').once("value", function(data){
            loadOverlays(data);
        });
        locRef.child('bounds').once("value", function(data){
            setBounds(data.val());
        });
    }
