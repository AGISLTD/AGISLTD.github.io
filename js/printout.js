$(document).ready(function(){
    var ratio = JSON.parse($('#selectPrintRatio option:selected').val());
    var printSelection = L.areaSelect({
            width:ratio[0], 
            height:ratio[1], 
            keepAspectRatio:true
        });
    
    $("#printButton").prop('disabled', true);
    
    $('#selectPrintRatio').change(function() {
        ratio = JSON.parse(this.value);
        printSelection.setDimensions({width: ratio[0], height: ratio[1]})
    })
    
    $('#selectPrintArea').click(function(){
        // add AreaSelect with keepAspectRatio:true
        
//        printSelection.on("change", function() {
//            console.log("Bounds changed: "+this.getBounds());
//        });
        printSelection = L.areaSelect({
            width:ratio[0], 
            height:ratio[1], 
            keepAspectRatio:true
        });
        printSelection.addTo(map);
        $("#printButton").prop('disabled', false);
    })
    
    function PrintHeightWidth(){
        var rat = ratio[1] / ratio[0];
        if (rat > 1){
            return [window.outerHeight / rat, window.outerHeight];
        } else {
            return [window.outerWidth, window.outerWidth * rat];
        }
    }
    
    $("#printButton").click(function(){
        var origBounds = map.getBounds(); // Save the current map view to return to it.
        var origWidth = $('#map').width;
        var origHeight = $('#map').height;
        printSelection.remove(); // No longer need the selection
        $('#map').css("height", (PrintHeightWidth()[1]));
        $('#map').css("width", (PrintHeightWidth()[0]));
        map.invalidateSize(false);
        map.fitBounds(printSelection.getBounds());
        printWindow = window.open('print.html','targetWindow','toolbar=no,location=no,status=no,  menubar=no,scrollbars=yes, resizable=no, width='+PrintHeightWidth()[0]+", height="+PrintHeightWidth()[1]);   
//        printWindow = window.open('print.html','targetWindow');
//        $(printWindow.document).ready(function(){
////            $(printWindow.document).find('div#map').html($('#map').html());
//            $(printWindow.document).find('div#map').html("TEST");
//        });
        window.setTimeout(function(){
            $(printWindow.document).find('main').html($('#mappane').html());    
            $(printWindow.document).find('#map').css("margin-top",'0px');
            printWindow.print();
            printWindow.close();
            window.dispatchEvent(new Event('resize'));
        }, 2000);
        $("#printButton").prop('disabled', true);
//        $('#map').css("height", origHeight);
//        $('#map').css("width", origWidth);
        map.fitBounds(origBounds); // Reset to the bounds before we printed
        return false;
    });
});