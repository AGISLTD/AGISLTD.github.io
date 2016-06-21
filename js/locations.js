var quadsUrl = 'https://api.tiles.mapbox.com/v4/reubencm.a8s085tw/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicmV1YmVuY20iLCJhIjoiZjAwNTUwYzBiNWJmNTI5MGI0MWVlNjQxMGY2Mjc5MGIifQ.LlNHQjzO6j4arWcGxGhpZw';

var hungryCreekTiles = L.tileLayer(quadsUrl, {id: 'reubencm.a8s085tw', attribution: "AGIS", 
                accessToken: 'pk.eyJ1IjoicmV1YmVuY20iLCJhIjoiZjAwNTUwYzBiNWJmNTI5MGI0MWVlNjQxMGY2Mjc5MGIifQ.LlNHQjzO6j4arWcGxGhpZw'});
var quadDangerLayer = L.tileLayer(quadsUrl, {id: 'reubencm.4654v47r', attribution: "AGIS", 
                opacity: 0.7,
                accessToken: 'pk.eyJ1IjoicmV1YmVuY20iLCJhIjoiZjAwNTUwYzBiNWJmNTI5MGI0MWVlNjQxMGY2Mjc5MGIifQ.LlNHQjzO6j4arWcGxGhpZw'});
var waitawaTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v4/reubencm.028vblnt/{z}/{x}/{y}.png?access_token={token}', {
                attribution: 'AGIS',
                zIndex: 150,
                subdomains: ['a','b','c','d'],
                mapId: "reubencm.028vblnt",
                token: "pk.eyJ1IjoicmV1YmVuY20iLCJhIjoiY2ltenFlYTQwMDUxeXV3bTRpMnhvaWU3dCJ9.UnrbxqzwsbW0kcMO6mYD8Q"});
            


    function loadMapboxTiles(){
        //tileLayer.addTo(map);
        LayersControl.addOverlay(waitawaTiles, "Waitawa Regional Park");
        LayersControl.addOverlay(hungryCreekTiles, "Hungry Creek");
        LayersControl.addOverlay(quadDangerLayer, "Quad No-Go Zone");
        
        map.on("overlayadd", function(e) { // Remove this functionality - unnecessary for now
//            if (e.layer == waitawaTiles) {
//                var latlongBounds = [
//                    [-36.94893148458695, 175.12945175170898],
//                    [-36.92577767819879, 175.15494346618652]
//                ];
//                map.setMaxBounds(latlongBounds);
//            } else if (e.layer == hungryCreekTiles) {
//                var latlongBounds = [
//                    [-36.531915750839985, 174.6809434890747],
//                    [-36.50704910158377, 174.72617626190186]
//                ];
//                map.setMaxBounds(latlongBounds);
//            }
//            map.options.minZoom = 14;
//            map.panTo(latlongBounds[0], {animate: true});
        });
        
    }
        

    function locationSwitch(sel){
        map.removeLayer(drawnItems); // Always remove geojson straight away
        map.removeLayer(labels);
        //Refresh the drawnItems Featuregroup to clear any existing features
        drawnItems = new L.FeatureGroup();
        labels = new L.LayerGroup();
        map.addLayer(drawnItems);
        map.addLayer(labels);
        
        locationID = sel.value;
        locRef = rootRef.ref("/location/"+locationID);
        locRef.child('currentEdit').once("value", function(data) {
            loadMapboxTiles();
            registerDrawControl(drawnItems);

            // load geojson into drawnItems
            var editID = data.val();
            if (undefined != editID){
                rootRef.ref("edit/"+locationID+"/"+editID+"/geojsonid/").once('value', function(data) {
                    rootRef.ref("geojson/"+data.val()).once('value', function(json){
                        geojson = json.val();
                        L.geoJson(geojson, {
                        onEachFeature: function (feature, layer) {
                          layer.properties = feature.properties;
                          //layer.options = {};
                          switch (feature.properties.type) {
                              case "trough":
                              case "gate":
                              case "spill":
                              case "fire":
                              case "fuel":
                              case "health":
                              case "safety":
                              case "info":
                                  layer.options.icon = L.icon({
                                        type: feature.properties.type,
                                        iconUrl: './images/'+feature.properties.type+'-icon.svg',
                                        iconSize:     [32, 18], // size of the icon
                                        iconAnchor:   [16, 9], // point of the icon which will correspond to marker's location
                                        popupAnchor:  [0, -5], // point from which the popup should open relative to the iconAnchor
                                    })
                                  break;

                              case "field":
                                  $.extend(layer.options, PolygonEnum.PADDOCK.shapeOptions); // add paddock styles to the feature
    //                              layer.options.color = 'brown';
    //                              layer.options.fillColor = 'green';
    //                              layer.options.opacity = 0.2;
                                  break;
                              case "nogozone":
                                  layer.options.color = 'red';
                                  layer.options.fillColor = 'red';
                                  layer.options.opacity = 0.2;
                                  break;

                              case "water":
                                  layer.options.color = 'lightblue';
                                  layer.options.weight = 7;
                                  break;
                              case "quad":
                                  layer.options.color = 'green';
                                  layer.options.weight = 3;
                                  break;
                              case "power":
                                  layer.options.color = 'red';
                                  layer.options.weight = 4;
                                  break;
                          }
                        drawnItems.addLayer(layer);
                        addLabelsToFeature(layer, layer.properties.name, layer.properties.details);
                      }
                        });
                  });
                });
            } else {
                alert("No map saved for you yet");
            }
        });
    }
