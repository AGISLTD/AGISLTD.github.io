var map;
var drawControl; // Edit/Delete controls
var location;

$(document).ready(function(){
    $('#Username').keypress(function(e){
              if(e.keyCode==13)
              $('#userLogin').click();
            });
    
    map = L.map('map', {
			center: [-36.8485, 174.7633],
			zoom: 10,
            //drawcontrol: true,
			layers: [grayscale, linz]
		});
    
    GeoJSONControl.addTo(map);
    map.addControl(printControl);
    
    // Add relevant data / icons / labels for new feature created
    map.on('draw:created', function (e) {
			var type = e.layerType,
				layer = e.layer;
            
            layer.properties = {};
            
			if (type === 'marker') {
                // Set the relevant icon
                layer.properties.type = layer.options.icon.options.type;
                askForFeatureDetails(e.layer);
			}

			if (type === 'polygon') {
                layer.properties.type = layer.options.polyType; // all polygons are fields
                askForFeatureDetails(e.layer);
			}
            
            if (type === 'polyline') {
                layer.properties.type = layer.options.lineType; // !!!!
                askForFeatureDetails(e.layer);
            }
            
            // Add to our feature  group
			drawnItems.addLayer(layer);
		});
    
    LayersControl.addTo(map);
});

// Asks user for details about the Feature they just added
function askForFeatureDetails(layer) {
    var detailsPopup = L.popup();
    var content = '<span><b>Label</b></span><br/><input id="shapeName" type="text" placeholder="eg \''+layer.properties.type.toUpperCase()+'\'"/><br/><br/><span><b>Details<b/></span><br/><textarea id="shapeDesc" cols="25" rows="5"></textarea><br/><br/><input type="submit" id="okBtn" value="Save" onclick="saveFeatureDetails()"/>';
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
function saveFeatureDetails() {
    var sName = document.getElementById("shapeName").value;
    var sDetails = document.getElementById("shapeDesc").value;

    var feature = drawnItems.getLayers()[drawnItems.getLayers().length - 1];  //drawnItems is a container for the drawn objects
    feature.properties.name = sName;
    feature.properties.details = sDetails;
    addLabelsToFeature(feature, sName, sDetails);
    map.closePopup();
}

function addLabelsToFeature(feature, labeltext, details){
    
    if (details) {
        feature.bindPopup(details);
    }
    
    if (labeltext) {
        if (feature._latlng){ // hacky way to check if it's a point marker, rather than line or poly
            feature.bindLabel(labeltext, { noHide: true });
            feature.showLabel();
        } else {
            // create a 'ghost marker' to bind the label to
            var marker = new L.marker(feature.getBounds().getNorthWest(), { opacity: 0.01 });
            marker.bindLabel(labeltext, {noHide: true, className: "my-label", offset: [0, 0] });
            labels.addLayer(marker);
            labels.addTo(map);
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

//GeoServer Print Controls
var printProvider = L.print.provider({
   method: 'GET',
//           url: 'http://localhost:8080/geoserver/pdf',
    capabilities: {
        scales: [
        {
        name: "1:25,000",
        value: "25000.0"
        },
        {
        name: "1:50,000",
        value: "50000.0"
        },
        {
        name: "1:100,000",
        value: "100000.0"
        },
        {
        name: "1:200,000",
        value: "200000.0"
        },
        {
        name: "1:500,000",
        value: "500000.0"
        },
        {
        name: "1:1,000,000",
        value: "1000000.0"
        },
        {
        name: "1:2,000,000",
        value: "2000000.0"
        },
        {
        name: "1:4,000,000",
        value: "4000000.0"
        }
        ],
        dpis: [
        {
        name: "75",
        value: "75"
        },
        {
        name: "150",
        value: "150"
        },
        {
        name: "300",
        value: "300"
        }
        ],
        outputFormats: [
        {
        name: "pdf"
        }
        ],
        layouts: [
        {
        name: "A4 portrait",
        map: {
        width: 440,
        height: 483
        },
        rotation: true
        },
        {
        name: "Legal",
        map: {
        width: 440,
        height: 483
        },
        rotation: false
        }
        ],
        printURL: "http://localhost:8080/geoserver/pdf/print.pdf",
        createURL: "http://localhost:8080/geoserver/pdf/create.json"
        },
    customParams: {
        mapTitle: "Printing Demo",
        comment: "This is a simple map printed from GeoExt."
    },
   autoLoad: true,
   dpi: 300
});
var printControl = L.control.print({
   provider: printProvider
});

// Map layer details

var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    mbUrl = 'https://api.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw',
    linzUrl = 'http://tiles-a.data-cdn.linz.govt.nz/services;key=780af066229e4b63a8f9408cc13c31e8/tiles/v4/set=2/EPSG:3857/{z}/{x}/{y}.png';

var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr}),
    streets  = L.tileLayer(mbUrl, {id: 'mapbox.streets',   attribution: mbAttr}),
    linz = L.tileLayer(linzUrl, {attribution: "LINZ Aerial Photography"});

var baseLayers = {
    "Grayscale": grayscale,
    "Streets": streets,
    "LINZ": linz
};
var overlays = {};
        
var drawnItems = new L.FeatureGroup();
var labels = new L.LayerGroup();
var LayersControl = L.control.layers(baseLayers, overlays, {
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

//FB login
function facebookAuth(){
    rootRef.authWithOAuthPopup("facebook", function(error, authData) {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        console.log("Authenticated successfully with payload:", authData);
          userSwitch(authData.uid);
          $('#logindeetz').show();
          $('#fbName').text(authData.facebook.displayName);
          $('#userLoginContainer').hide();
      }
    });
}

function logout(){
    if (drawControl) {
        map.removeControl(drawControl);
    }
    firebase.auth().signOut().then(function() {
        $('#logindeetz').hide();
          $('#fbName').text("");
          $('#userLoginContainer').show();
        userSwitch(-1);
    }, function(error) {
      alert("Failed to sign out..");
    });
}

function userLogin() {
    firebase.auth().signInWithEmailAndPassword($("#email").val(), $("#password").val()).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      alert("Failed to log in: "+errorMessage)
      return;
    });
    
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        userSwitch(user.uid);
        $('#userLoginContainer').hide();
        $('#fbName').text(user.email);
        $('#logindeetz').show();
      } else {
        $('#userLoginContainer').show();
        $('#logindeetz').hide();
      }
    });
}

function userSwitch(val) {      
    
    if (val == -1) {//logout
        map.removeLayer(drawnItems); // Always remove geojson straight away
        map.removeLayer(labels);
        userRef = null;
        return;
    }

    // set userRef
    userRef = rootRef.ref("/user/"+val);
}