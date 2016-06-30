class FeatureCategory {
    constructor(name){
        this.name = name;
        this.layers = {}; // collection of FeatureTypes
    }
    
    addFeatureGroup(featureGroup){
        this.layers.addLayer(featureGroup);
    }
    
    // shows all the features of this category
    show() {
        $.each(this.layers, function(index, element){
            element.show();
        });
    }
    
    // hide all features in this category
    hide() {
        $.each(this.layers, function(index, element){
            element.hide();
        });
    }
}

class Feature {
    constructor(type, name, description, icon, shapeoptions){
        this.featuretype = type;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.shapeoptions = shapeoptions;
    }
    
    show(){
        map.addLayer(this.featureGroup);
    }
    
    hide() {
        map.removeLayer(this.FeatureGroup);
    }
}