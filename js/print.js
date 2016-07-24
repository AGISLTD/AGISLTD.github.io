$(document).ready(function(){
    $("#printButton").click(function(){    

    //transform map pane
    var mapTransform = $("#printPreview .leaflet-map-pane").css("transform"); //get the current transform matrix
    var mmpp = adjustScale(); //get mm per css-pixel
    var multiplier = mmpp[1] * 3.7795; //multiply paper mm per css-pixel by css-pixels per mm to get zoom ratio
    var mapTransform2 = mapTransform + " scale("+ multiplier +")"; //add the scale transform
    $("#printPreview .leaflet-map-pane").css("transform", mapTransform2); //set new transformation

    //set new transform origin to capture panning
    var tfMatrix = mapTransform.split("(")[1].split(")")[0].split(", ");
    var toX = 0 - tfMatrix[4],
        toY = 0 - tfMatrix[5];
    $("#printPreview .leaflet-map-pane").css("transform-origin", toX + "px " + toY + "px");

    //determine which is long side of paper
    var sdim, ldim;
    if ($("#paperOrientation option[value=portrait]").prop("selected")){
        sdim = "width";
        ldim = "height";
    } else {
        sdim = "height";
        ldim = "width";
    };

    //store prior dimensions for reset
    var previewWidth = $("#printPreview").css("width"),
        previewHeight = $("#printPreview").css("height")

    //set the page dimensions for print
    var paperLongside = getLongside(); //paper length in mm minus 20mm total print margins minus border
    $("#printPreview").css(ldim, paperLongside + "mm");
    $("#printPreview").css(sdim, paperLongside/Math.sqrt(2) + "mm");
    $("#container").css("height", $("#printPreview").css("height"));
    
    //adjust the scale bar
    var scaleWidth = parseFloat($("#printBox .leaflet-control-scale-line").css('width').split('px')[0]);
    $("#printBox .leaflet-control-scale-line").css('width', String(scaleWidth * multiplier * 1.1) + "px");
    $("#printBox .leaflet-control-scale").css({
        'margin-bottom': String(5 * multiplier * 1.1) + "px",
        'margin-left': String(5 * multiplier * 1.1) + "px"
    });

    //adjust north arrow
    var arrowWidth = parseFloat($(".northArrow img").css('width').split("px")[0]),
        arrowMargin = parseFloat($(".northArrow").css('margin-top').split("px")[0]);
    $(".northArrow img").css({
        width: String(arrowWidth * multiplier * 1.1) + "px",
        height: String(arrowWidth * multiplier * 1.1) + "px"
    });
    $(".northArrow").css({
        "margin-right": String(arrowMargin * multiplier * 1.1),
        "margin-top": String(arrowMargin * multiplier * 1.1)
    });

    //print
    window.print();

    //reset print preview
    $("#printPreview .leaflet-map-pane").css("transform", mapTransform); //reset to original matrix transform
    $("#printPreview").css({
        width: previewWidth,
        height: previewHeight
    });
    //reset scale bar
    $("#printBox .leaflet-control-scale-line").css('width', scaleWidth+"px");
    $("#printBox .leaflet-control-scale").css({
        'margin-bottom': "",
        'margin-left': ""
    });
    //reset north arrow
    $(".northArrow img").css({
        width: arrowWidth + "px",
        height: arrowWidth + "px"
    });
    $(".northArrow").css({
        "margin-right": arrowMargin,
        "margin-top": arrowMargin
    });
});
});