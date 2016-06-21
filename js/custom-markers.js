var marker, polygon, line; // define markers once -- prevents a new marker created each time we select a type

var MarkerEnum = {
    GATE: {type: "gate", img: "png"},
    TROUGH: {type: "trough", img: "png"},
    HEALTH: {type: "health", img: "svg"},
    FUEL: {type: "fuel", img: "svg"},
    FIRE: {type: "fire", img: "svg"},
    SPILL: {type: "spill", img: "svg"},
    SAFETY: {type: "safety", img: "svg"},
    INFO: {type: "info", img: "svg"},
    HAZARD: {type: "hazard", img: "svg"},
};

var PolygonEnum = {
    PADDOCK: {shapeOptions:{color:'brown',fillColor:'green', polyType: "field"}},
    NOGOZONE: {shapeOptions:{color:'red',fillColor:'red', polyType: "nogozone"}},
};

var LineEnum = {
    WATERWAY: {shapeOptions:{color:'lightblue', weight: 7, lineType: "water"}},
    QUADTRACK: {shapeOptions:{color:'green', weight: 3, lineType: "quad"}},
    POWERLINE: {shapeOptions:{color:'red', weight: 4, lineType: "power"}},
};

if (Object.freeze) { // lock the enums
    Object.freeze(MarkerEnum);
    Object.freeze(PolygonEnum);
    Object.freeze(LineEnum);
};

// 'Disables' (cancels) the drawing of any currently selected marker/poly/line
function disableExistingDraw() {
    if (marker) { // check a 'previous' marker exists
        marker.disable(); // disable any previous marker
    }
    if (polygon) { 
        polygon.disable(); 
    }
    if (line) { 
        line.disable(); 
    }
}

function addMarker(markertype) {
    disableExistingDraw();
    marker = new L.Draw.Marker(map);
    marker.options.icon = L.icon({
        type: markertype.type,
        iconUrl: './images/'+markertype.type+'-icon.'+markertype.img,
        iconSize:     [32, 18], // size of the icon
        iconAnchor:   [16, 9], // point of the icon which will correspond to marker's location
        popupAnchor:  [0, -5], // point from which the popup should open relative to the iconAnchor
    })
    marker.enable();
}

// Creating this as an extension of Draw.Polygon fixed an issue where overwriting options was wiping out the default Icon for vertexes
CustomPoly = L.Draw.Polygon.extend({
    options: {
        allowIntersection: false,
        showArea: true,
        stroke: false
    }
});

function addPolygon(polytype) {
    disableExistingDraw();
    polygon = new CustomPoly(map, polytype);
    polygon.enable();
}

CustomLine = L.Draw.Polyline.extend({
    options: {}
});

function addPolyline(linetype) {
    disableExistingDraw();
    line = new CustomLine(map, linetype);
    line.enable();
}

// Returns JSON for the given features
function buildGeoJSONFromFeatureLayer(features){
    var drawnFeaturesJSON = features.toGeoJSON();
    // Iterate through each layer and add the custom properties 
    // to the JSON which were not added by the toGeoJSON method.
    var i = 0;
    features.eachLayer(function(layer){
        drawnFeaturesJSON.features[i].properties = layer.properties;
        i++;
    });
    return drawnFeaturesJSON;
}

// sets the json into the text box and into the Firebase dataref
function saveGeoJson(){
    var json = buildGeoJSONFromFeatureLayer(drawnItems);
    
    document.getElementById("JSONBox").value = JSON.stringify(json);
    jsonid = rootRef.ref('/geojson/').push(json).key;
    var edit = {};
    edit.geojsonid = jsonid;
    edit.user = 'anon';
    edit.datetime = Date.now();
    editID = rootRef.ref('/edit/'+locationID).push(edit).key;
    locRef.update({'currentEdit': editID});
}