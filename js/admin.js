$(document).ready(function(){
    
    $('.chosen-select').chosen({width: "95%"});
    
    $.addTemplateFormatter("ListifyArray",
        function(value, template) {
        if (value && value.length > 0){
            return value.map(function(data){return capitalizeFirstLetter(data)+", "});
        }
    });
    $.addTemplateFormatter("BoundsFormatter",
        function(value, template) {
        if (value && value.length == 2 && value[0].length==2&&value[1].length==2) {
            return "<i>NW </i><b>"+value[0][0]+", "+value[0][1]+" </b><i>SE </i><b>"+value[1][0]+", "+value[1][1]+"</b>";
        } else {
            return "Invalid bounds";
        }
    });
    $.addTemplateFormatter("ExtractKeys",
        function(value, template) {
            if (value){
                return Object.keys(value);
            }
    });
    $.addTemplateFormatter("KeyCount",
        function(value, template) {
            if (value){
                return Object.keys(value).length;
            }
    });
    $.addTemplateFormatter("ListifyObject",
        function(value, template) {
            if (value){
                return Object.keys(value).map(function(data){return capitalizeFirstLetter(data)+", "});
            }
    });
    
    logindialog = $( "#dialog-login" ).dialog({
      autoOpen: true,
      height: 250,
      width: 350,
      modal: true,
      draggable: false,
      resizable: false,
      dialogClass: "no-close"
    });
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            if (logindialog){
                logindialog.dialog("close");
            }
            openTab("Locations");
            
            registerLocations();
            registerUsersTable();
        }
    });
});

function userLogin() {
    var email = $("#email").val();
    firebase.auth().signInWithEmailAndPassword(email, $("#password").val()).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      alert("Failed to log in: "+errorMessage)
      return;
    });
}

function openTab(tabName) {
    var i;
    var x = document.getElementsByClassName("tab");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none"; 
    }
    document.getElementById(tabName).style.display = "block"; 
}

// USER ADMIN

function registerUsersTable(){
    rootRef.ref('/user/').off();
    $('#userTableBody').html("");
    rootRef.ref('/user/').on('child_added', function(data){
        loadUserRow(data);
    });
    rootRef.ref('/user/').on('child_changed', function(data){
        deleteUserRow(data.key);
        loadUserRow(data);
    });
    rootRef.ref('/roles/').on('child_changed', function(data){
        rootRef.ref('/user/'+data.key).once('value', function(snap){
            deleteUserRow(snap.key);
            loadUserRow(snap);
        });
    });
}

function loadUserRow(data){
    var name = data.val().name;
    var logo = data.val().logo;
    var key = data.key;
    rootRef.ref('/roles/'+key).once('value', function(snap){
        $('#userTableBody').loadTemplate(
            "templates/userrow.html", 
            {
                name: name,
                logo: logo,
                roles: snap.val(),
                key: key
            },
            { append: true, elemPerPage: 10, paged: true}
        );
    });
}

function addUserDetails() {
    var guid = $('#newUserGuid').val();
    var displayname = $('#userDisplayName').val();
    var role = $('#userRole').val();
    var logo = $('#userLogo').val();
    var locations = $('#newUserLocations').val().reduce(function(map, obj) {map[obj] = true; return map}, {});
    var features = $('#usersFeatures').val().reduce(function(map, obj) {map[obj] = true; return map}, {});
    rootRef.ref('/user/'+guid).set({name: displayname, logo: logo});
    rootRef.ref('/roles/'+guid+'/role').set(role);
    rootRef.ref('/roles/'+guid+'/locations').set(locations);
    rootRef.ref('/roles/'+guid+'/features').set(features);
    document.getElementById('userForm').style.display='none';
    resetUserForm();
}

function editUser(button){
    openUserForm();
    var row = $(button.parentElement.parentElement);
    var guid = button.attributes['data-key'].value;
    $('#newUserGuid').val(guid);
    $('#newUserGuid').prop('disabled', true);
    $('#userDisplayName').val(row.find('td[name="name"]').html());
    $('#userRole').val(row.find('td[name="role"]').html());
    $('#userLogo').val(row.find('td[name="logo"]').attr("data"));
    $('#newUserLocations').val(row.find('td[name="locations"]').attr("data").split(','));
    $('#usersFeatures').val(row.find('td[name="features"]').attr("data").split(','));
    $('#newUserLocations').trigger("chosen:updated");
    $('#usersFeatures').trigger("chosen:updated");
}

function deleteUser(button, askFirst){
    var guid = button.attributes['data-key'].value;
    if (askFirst && confirm("Delete this User's details? You will need to disable their account on Firebase also")){
        rootRef.ref('/user/'+guid).set(null);
        rootRef.ref('/roles/'+guid).set(null);
        deleteUserRow(guid);
    }
}

function deleteUserRow(key){
    $("#userTableBody tr[data-key='"+key+"']").remove()
}

function resetUserForm(){
    $('#newUserGuid').val("");
    $('#newUserGuid').prop('disabled', false);
    $('#userDisplayName').val("");
    $('#userRole').val("editor");
}

function openUserForm(){
    resetUserForm();
    document.getElementById('userForm').style.display='block';
}

// END USER ADMIN

// LOCATION ADMIN

var newLocation = true; // flag for creating a new location, rather than editing existing.

function addLocation() {
    var guid = $('#locationGuid').val();
    var name = $('#locationName').val();
    var nwBound = [$('#locationBoundNWLat').val(), $('#locationBoundNWLong').val()];
    var seBound = [$('#locationBoundSELat').val(), $('#locationBoundSELong').val()];
    var bounds = [nwBound, seBound];
//    var locations = $('#newUserLocations').val().reduce(function(map, obj) {map[obj] = true; return map}, {});
//    var features = $('#usersFeatures').val().reduce(function(map, obj) {map[obj] = true; return map}, {});
    if (newLocation){
        rootRef.ref('/location/').push({name: name, bounds: bounds});
    } else {
        rootRef.ref('/location/'+guid).set({name: name, bounds: bounds});
    }
    document.getElementById('locationForm').style.display='none';
    resetLocationForm();
}

function editLocation(button){
    openLocationForm();
    var row = $(button.parentElement.parentElement);
    var guid = button.attributes['data-key'].value;
    var bounds = row.find('td[name="bounds"]').attr("data").split(',');
    $('#locationGuid').val(guid);
    $('#locationName').val(row.find('td[name="name"]').html());
    $('#locationBoundNWLat').val(bounds[0]);
    $('#locationBoundNWLong').val(bounds[1]);
    $('#locationBoundSELat').val(bounds[2]);
    $('#locationBoundSELong').val(bounds[3]);
    newLocation = false; // set to update mode
}

// Load Locations Table and Dropdown
function registerLocations(){
    rootRef.ref('/location/').off();
    $('#locationTableBody').html("");
    $('.allLocationsDropDown').html("");
    rootRef.ref('/location/').orderByChild("name").on('child_added', function(data){
        loadLocationRow(data);
        
        $('.allLocationsDropDown').loadTemplate(
            "templates/locationoption.html", 
            {
                data: data.val(),
                key: data.key
            },
            { append: true, elemPerPage: 10, paged: true, 
             complete: function(){
                    $('.allLocationsDropDown').trigger("chosen:updated");
                }
            }
        );
    });
    
    rootRef.ref('/location/').on('child_changed', function(data){
        deleteLocationRow(data.key);
        loadLocationRow(data);
        // todo -- remove from the locations dropdown also
    });
}

function loadLocationRow(data){
    $('#locationTableBody').loadTemplate(
            "templates/locationrow.html", 
            {
                data: data.val(),
                key: data.key
            },
            { append: true, elemPerPage: 10, paged: true}
        );
}


function deleteLocation(button, askFirst){
    alert("Location deletion is not supported");
//    var guid = button.attributes['data-key'].value;
//    if (askFirst && confirm("Delete this Location? This is permanent")){
//        rootRef.ref('/user/'+guid).set(null);
//        rootRef.ref('/roles/'+guid).set(null);
//        deleteUserRow(guid);
//    }
}

function deleteLocationRow(key){
    $("#locationTableBody tr[data-key='"+key+"']").remove()
}

function resetLocationForm(){
    $('#locationGuid').val("");
    $('#locationName').val("");
    $('#locationBoundNWLat').val("");
    $('#locationBoundNWLong').val("");
    $('#locationBoundSELat').val("");
    $('#locationBoundSELong').val("");
    newLocation = true;
}

function openLocationForm(){
    resetLocationForm();
    document.getElementById('locationForm').style.display='block';
}

// END LOCATION ADMIN

// OVERLAY ADMIN

function locationSelected(){
    $('#overlayTableBody').html("");
    var locID = $('#overlayLocationSelect').val();
    rootRef.ref('/location/'+locID+'/overlays/').off('child_added');
    rootRef.ref('/location/'+locID+'/overlays/').on('child_added', function(data){
        if (data.val()){
            $('#overlayTableBody').loadTemplate(
            "templates/overlayrow.html",
                { 
                    data: data.val(),
                    key: data.key
                },
                { append: true, complete: function(){
                    $('.geojsonlink:not([data-key])').hide();
                } }
            );
        } else {
            $('#overlayTableBody').html("<tr><td class='w3-opacity w3-text-grey' colspan=5>--No Overlays--</td></tr>");
        }
    });
}

var newOverlay = true; // flag for creating a new location, rather than editing existing.

function addOverlay() {
    var locationguid = $('#overlayLocationSelect').val()
    var name = $('#overlayName').val();
    var showByDefault = $('#overlayDefault').prop('checked');
    var url = $('#wmsOverlayURL').val().length > 0 ? $('#wmsOverlayURL').val() : null;
    var geojsonID = $('#overlayGeoJSON').val().length > 0 ? saveGeoJSON($('#overlayGeoJSON').val()) : null;
    if (geojsonID == "Invalid JSON in GeoJSON box"){
        alert(geojsonID);
        return;
    }
    var geojsonstyle = "";
    try {
        geojsonstyle = $('#overlayGeoJSONstyle').val().length > 0 ? JSON.parse($('#overlayGeoJSONstyle').val()) : null;
    } catch (error) {
        if (!(geojsonstyle)){
            alert("Invalid style JSON");
            return;
        }
    }
    var overlay = {name: name, default: showByDefault, tilesURL: url, geojsonid: geojsonID, style: geojsonstyle};
    if (newOverlay){
        rootRef.ref('/location/'+locationguid+'/overlays/').push(overlay);
    } else {
        var existingOverlayGUID = $('#overlayGUID').val();
        rootRef.ref('/location/'+locationguid+'/'+existingOverlayGUID).set(overlay);
    }
    document.getElementById('overlayForm').style.display='none';
    resetOverlayForm();
}

function deleteOverlay(button){
    var guid = button.attributes['data-key'].value;
    if (confirm("Delete this Overlay? This is a permanent action")){
        var locationguid = $('#overlayLocationSelect').val()
        rootRef.ref('/location/'+locationguid+'/overlays/'+guid).once("value", function(snap){
            if (snap.val().geojsonid){
                rootRef.ref('/geojson/'+snap.val().geojsonid).set(null);
            }
        });
        rootRef.ref('/location/'+locationguid+'/overlays/'+guid).set(null);
        deleteOverlayRow(guid);
    }
}

function deleteOverlayRow(key){
    $("#overlayTableBody tr[data-key='"+key+"']").remove()
}

function resetOverlayForm() {
    $('#overlayName').val("");
    $('#wmsOverlayDefault').prop('checked', false);
    $('#wmsOverlayURL').val("");
    $('#overlayGeoJSON').val("");
    $('#overlayGeoJSONstyle').val("");
    newOverlay = true;
}

function openOverlayForm(){
    resetOverlayForm();
    document.getElementById('overlayForm').style.display='block';
}

// END OVERLAY ADMIN

function capitalizeFirstLetter(string) {
    if (string){
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

function saveGeoJSON(json){
    try {
        var obj = $.parseJSON(json);
        var geojsonref = rootRef.ref('/geojson/').push();
        geojsonref.set(obj);
        return geojsonref.key;
    } catch (error) {
        return "Invalid JSON";
    }
}

function downloadOverlayJSON(link){
    downloadGeoJson($(link).attr("data-key"), "DIYMapper-Overlay.geojson");
}