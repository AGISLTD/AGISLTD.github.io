var gateicon = L.icon({
    type: 'gate',
    iconUrl: './images/gate-icon.png',
    iconSize:     [32, 18], // size of the icon
    iconAnchor:   [16, 9], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76], // point from which the popup should open relative to the iconAnchor
});


GateMarker = L.Draw.Marker.extend({
    options: {
        icon: gateicon
    }
});

function gate() {
    var gateMarker = new GateMarker(map);
    gateMarker.enable();
}


var troughIcon = L.icon({
    type: 'trough',
    iconUrl: './images/trough-icon.png',
    iconSize:     [32, 15], // size of the icon
    iconAnchor:   [16, 7], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76], // point from which the popup should open relative to the iconAnchor
});


TroughMarker = L.Draw.Marker.extend({
    options: {
        icon: troughIcon
    }
});
function trough() {
    var gateMarker = new TroughMarker(map);
    gateMarker.enable();
}

PaddockPoly = L.Draw.Polygon.extend({
    options: {
        allowIntersection: false,
        showArea: true,
        stroke: false,
        fillColor: 'green'
    }
});

function field() {
    var fieldPolygon = new PaddockPoly(map, { shapeOptions:{color:'brown',fillColor:'green'}});
    fieldPolygon.enable();
}

function getGeoJson(){
    var drawnFeaturesJSON = drawnItems.toGeoJSON();
    var i = 0;
    drawnItems.eachLayer(function(layer){
        layer.bindPopup(i+"");
        drawnFeaturesJSON.features[i].properties = layer.properties;
        i++;
    });
    document.getElementById("JSONBox").value = JSON.stringify(drawnFeaturesJSON);
    myDataRef.set(drawnFeaturesJSON);
}

function saveGeoJson(){
    var drawnFeaturesJSON = drawnItems.toGeoJSON();
    var i = 0;
    drawnItems.eachLayer(function(layer){
        layer.bindPopup(i+"");
        drawnFeaturesJSON.features[i].properties = layer.properties;
        i++;
    });
    document.getElementById("JSONBox").value = JSON.stringify(drawnFeaturesJSON);
    userRef.update(drawnFeaturesJSON);
}