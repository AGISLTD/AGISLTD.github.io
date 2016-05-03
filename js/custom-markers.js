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


var healthIcon = L.icon({
    type: 'health',
    iconUrl: './images/health-icon.svg',
    iconSize:     [30, 30], // size of the icon
    iconAnchor:   [15, 15], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76], // point from which the popup should open relative to the iconAnchor
});


HealthMarker = L.Draw.Marker.extend({
    options: {
        icon: healthIcon
    }
});

function health() {
    var healthMarker = new HealthMarker(map);
    healthMarker.enable();
}

var fuelIcon = L.icon({
    type: 'fuel',
    iconUrl: './images/fuel-icon.svg',
    iconSize:     [30, 30], // size of the icon
    iconAnchor:   [15, 15], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76], // point from which the popup should open relative to the iconAnchor
});


FuelMarker = L.Draw.Marker.extend({
    options: {
        icon: fuelIcon
    }
});

function fuel() {
    var marker = new FuelMarker(map);
    marker.enable();
}

var fireIcon = L.icon({
    type: 'fire',
    iconUrl: './images/fire-icon.svg',
    iconSize:     [30, 30], // size of the icon
    iconAnchor:   [15, 15], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76], // point from which the popup should open relative to the iconAnchor
});


FireMarker = L.Draw.Marker.extend({
    options: {
        icon: fireIcon
    }
});

function fire() {
    var marker = new FireMarker(map);
    marker.enable();
}

var spillIcon = L.icon({
    type: 'spill',
    iconUrl: './images/spill-icon.svg',
    iconSize:     [30, 30], // size of the icon
    iconAnchor:   [15, 15], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76], // point from which the popup should open relative to the iconAnchor
});


SpillMarker = L.Draw.Marker.extend({
    options: {
        icon: spillIcon
    }
});

function spill() {
    var marker = new SpillMarker(map);
    marker.enable();
}

var safetyIcon = L.icon({
    type: 'safety',
    iconUrl: './images/safety-icon.svg',
    iconSize:     [30, 30], // size of the icon
    iconAnchor:   [15, 15], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76], // point from which the popup should open relative to the iconAnchor
});


SafetyMarker = L.Draw.Marker.extend({
    options: {
        icon: safetyIcon
    }
});

function safety() {
    var marker = new SafetyMarker(map);
    marker.enable();
}

var infoIcon = L.icon({
    type: 'info',
    iconUrl: './images/info-icon.svg',
    iconSize:     [30, 30], // size of the icon
    iconAnchor:   [15, 15], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76], // point from which the popup should open relative to the iconAnchor
});


InfoMarker = L.Draw.Marker.extend({
    options: {
        icon: infoIcon
    }
});

function info() {
    var marker = new InfoMarker(map);
    marker.enable();
}


PaddockPoly = L.Draw.Polygon.extend({
    options: {
        allowIntersection: false,
        showArea: true,
        stroke: false
    }
});

function field() {
    var fieldPolygon = new PaddockPoly(map, { shapeOptions:{color:'brown',fillColor:'green', polyType: "field"}});
    fieldPolygon.enable();
}

NoGoPoly = L.Draw.Polygon.extend({
    options: {
        allowIntersection: false,
        showArea: true,
        stroke: false
    }
});
function nogozone() {
    var polygon = new NoGoPoly(map, { shapeOptions:{color:'red',fillColor:'red', polyType: "nogozone"}});
    polygon.enable();
}

WaterLine = L.Draw.Polyline.extend({
});

function water() {
    var waterLine = new WaterLine(map, {shapeOptions:{color:'lightblue', weight: 7, lineType: "water"}});
    waterLine.enable();
}

QuadLine = L.Draw.Polyline.extend({
});

function quad() {
    var line = new QuadLine(map, {shapeOptions:{color:'green', weight: 3, lineType: "quad"}});
    line.enable();
}

PowerLine = L.Draw.Polyline.extend({
});

function power() {
    var line = new PowerLine(map, {shapeOptions:{color:'red', weight: 4, lineType: "power"}});
    line.enable();
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