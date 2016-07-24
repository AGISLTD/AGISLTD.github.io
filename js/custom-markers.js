var drawFeature; // define markers once -- prevents a new marker created each time we select a type
var Feature = {};

// 'Disables' (cancels) the drawing of any currently selected marker/poly/line
function disableExistingDraw() {
    if (drawFeature) { // check an existing feature-draw exists
        drawFeature.disable(); // disable it
    }
}

function addFeature(type){
    disableExistingDraw();
    var feat = Feature[type];
    drawFeature = null;
    if (feat) {
        switch (feat.family) {
            case "marker":
                drawFeature = new L.Draw.Marker(map);
                drawFeature.options.icon = L.icon(feat.options.icon);
                break;
            case "polygon":
                drawFeature = new CustomPoly(map, {shapeOptions: feat.options});
                break;
            case "polyline":
                drawFeature = new CustomLine(map, {shapeOptions: feat.options});
                break;
        }
        drawFeature.enable();
    }
}

// Defining Extensions of Draw objects solves some issues which arose around overwriting options/icons
CustomMarker = L.Draw.Marker.extend({
    options: {}
});
CustomLine = L.Draw.Polyline.extend({
    options: {}
});
CustomPoly = L.Draw.Polygon.extend({
    options: {
        allowIntersection: false,
        showArea: true,
        stroke: false
    }
});

// Returns JSON for the given features
function buildGeoJSONFromFeatureLayer(category){
    var drawnFeaturesJSON = category.toGeoJSON();
    // Iterate through each layer and add the custom properties 
    // to the JSON which were not added by the toGeoJSON method.
    var i = 0;
    category.eachLayer(function(layer){
        drawnFeaturesJSON.features[i].properties = layer.properties;
        i++;
    });
    
    this.push.apply(this, drawnFeaturesJSON.features);
    return drawnFeaturesJSON;
}

// Saves GeoJSON for the current location
function saveGeoJson(){
    // collect all the features from each Category FeatureGroup
    var allFeatures = [];
    drawnItems.eachLayer(buildGeoJSONFromFeatureLayer, allFeatures);
    var json = drawnItems.toGeoJSON(); // To get out 'base geojson'
    json.features = allFeatures; // place all our features into the geojson
    
    document.getElementById("JSONBox").value = JSON.stringify(json);
    jsonid = rootRef.ref('/geojson/').push(json).key;
    var edit = {};
    edit.geojsonid = jsonid;
    edit.user = firebase.auth().currentUser.uid;
    edit.datetime = Date.now();
    editID = rootRef.ref('/edit/'+locationID).push(edit).key;
    locRef.update({'currentEdit': editID});
}