/**
 * 
 * Class Map
 * 
 * test pour futur integration d'un objet map ol3
 * 
 * @ignore
 * 
 */
kiss.ux.Map = class Map extends kiss.ui.Component {
    
    constructor() {
        super()
    }
    

    
    /**
     * Finalise l'objet map apres le rendre de l'element
     */
    render(targetId){
        
        super.render(targetId);
        this.renderMap();

    }
    
    renderMap(){
        this.map.setTarget( this.id );
        
    
        let parent = this.offsetParent;

        setTimeout( ()  => {
            this.map.setSize( [parent.offsetWidth ,parent.offsetHeight]);
        } , 0 );
 
    }


    /**
     * Generate the map objet
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     */
    init(config = {}) {
        super.init(config)

        // Template

        this.map = new ol.Map({
          layers: [
            new ol.layer.Tile({
              source: new ol.source.OSM(),
            }) ],
        
       
          view: new ol.View({
            center: ol.proj.fromLonLat([55.5264794 , -21.1306889] ),
            zoom: 10,
          }),
        });
        
        
        this.map.on('rendercomplete', function(){
        
                console.log("render ....");
        }  );
        


        this._setProperties(config, [
            [
                ["display", "flex", "position", "top", "left", "width", "height", "margin", "padding", "background", "backgroundColor", "borderColor", "borderRadius", "borderStyle", "borderWidth", "boxShadow"],
                [this.style]
            ]
        ]);
        return this;
    }

}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-map", kiss.ux.Map)
const createMap = (config) => document.createElement("a-map").init(config)

;