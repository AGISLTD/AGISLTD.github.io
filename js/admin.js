$(document).ready(function(){
    openTab("Locations");
    
    loadLocations();
    loadUsersTable();
    
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
});

function openTab(tabName) {
    var i;
    var x = document.getElementsByClassName("tab");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none"; 
    }
    document.getElementById(tabName).style.display = "block"; 
}

// USER ADMIN

function loadUsersTable(){
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
    var key = data.key;
    rootRef.ref('/roles/'+key).once('value', function(snap){
        $('#userTableBody').loadTemplate(
            "templates/userrow.html", 
            {
                name: name,
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
    var locations = $('#newUserLocations').val();
    var features = $('#usersFeatures').val();
//    var locations = $('#newUserLocations').val().reduce(function(map, obj) {map[obj] = true; return map}, {});
//    var features = $('#usersFeatures').val().reduce(function(map, obj) {map[obj] = true; return map}, {});
    rootRef.ref('/user/'+guid).set({name: displayname});
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
function loadLocations(){
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
    rootRef.ref('/location/'+locID+'/overlays/').on('child_added', function(data){
        if (data.val()){
            $('#overlayTableBody').loadTemplate(
            "templates/overlayrow.html",
                { 
                    data: data.val(),
                    key: data.key
                },
                { append: true }
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
    var url = $('#wmsOverlayURL').val();
    var geojsonID = $('#overlayGeoJSON').val();
    var geojsonstyle = $('#overlayGeoJSONstyle').val();
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

function resetOverlayForm(){
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