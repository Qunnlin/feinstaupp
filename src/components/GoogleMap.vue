<template>
    <div class="google-map">
        <div id="controls">
        </div>
        <div id="legend">
        </div>
        <gmap-map ref="mapRef"
        :center="center"
        :zoom="14"
        style="width:100%;  height: 900px;"
        >
        </gmap-map>    
    </div>
</template>

<script>
var Tiles = require('@gwenmohr/sensor-tiles-js');
import {MapElementMixin} from 'vue2-google-maps'
    export default {
        name: "GoogleMap",
        data: function () { 
            return {
                center: { lat: 48.7758459, lng: 9.1829321 },
                gridWidth: 100,
                grenzwerte: {
                    "temperature": { "min": -10, "max": 40, "metric": "C°"},
                    "pressure": {"min": 98000, "max": 105000, "metric": "Pa"},
                    "humidity": {"min": 20, "max": 100, "metric": "%"},
                    "P1": {"min": 0, "max": 50, "metric": "µg/m³"},
                    "P2": {"min": 0, "max": 20, "metric": "µg/m³"}
                },
                sensorTypes: ["P1", "P2", "temperature","pressure", "humidity"],
            }
        },
        created: function () { 
        },
        mounted: function () {
            this.$refs.mapRef.$mapPromise.then((map) => {
                // set Map Boundaries
                let mapBounds = {
                    north: 48.815000229,
                    south: 48.73,
                    west: 9.10,
                    east: 9.270019239

                };
 
                // set Map Options and Zoom
                map.setOptions({
                    minZoom: 12,
                    restriction: {
                        latLngBounds: mapBounds
                    }
                });

                // initialize controls & legend
                this.initCustomControls(map);
                this.initLegend(map);

                // generate grid over map
                var grid = this.generateGrid(mapBounds, this.gridWidth);

                // fetch current (<5 min) air data
                var currentSensorData = this.fetchJSON("https://data.sensor.community/airrohr/v1/filter/box="+ mapBounds.north + "," + mapBounds.east + "," + mapBounds.south + "," + mapBounds.west);
                currentSensorData.then(data => {

                    // sort air data after value_types (temperature, pressure, P1/P2 pollution)
                    var sortedData = this.sortSensorData(data);

                    // create overlays for each sensor type
                    this.sensorTypes.forEach(type => {

                        // generate interpolated data & update geoJson
                        var geojson = this.createGeoJson(grid);
                        let interpolated = this.insertSensorsPurescript(sortedData[type], type, mapBounds, this.gridWidth);
                        let l_geojson = this.mapGrid(geojson, interpolated, type);

                        // create Layer
                        let layer = this.createLayer(l_geojson, map);

                        // create controls & legend
                        this.addControlItem(layer,type, map)
                        this.addMarkerButton(sortedData[type], type, map);
                    })
  
                });         
                
                // add traffic layer & weather station data
                let trafficLayer = new google.maps.TrafficLayer;
                trafficLayer.setMap(map);
                this.addWeatherData(map);
            }); 
        },

        methods: {
            
            // fetch JSON data from URL
            async fetchJSON(url) {
                try {
                    var response = await fetch(url);
                    return response.json();
                } catch(err) {
                    alert(err);
                }
            },

            // fetch Data from URL
            async fetchData(url) {
                try {
                    var response = await fetch(url);
                    return response;
                } catch(err) {
                    alert(err);
                }
            },

            // sort Airsensor data
            sortSensorData(sensorData){
                var sortedData = {};
                sensorData.forEach( sensor => {
                    var newFormat = {};
                    newFormat.location = sensor.location;
                    newFormat.id = sensor.id;
                    newFormat.sensor = sensor.sensor;
                    newFormat.timestamp = sensor.timestamp;
                    newFormat.sensordatavalues = {};
                    sensor.sensordatavalues.forEach(sensordatavalue => {
                        if(this.grenzwerte.hasOwnProperty(sensordatavalue.value_type) && (sensordatavalue.value < this.grenzwerte[sensordatavalue.value_type].max *2) && (sensordatavalue.value > this.grenzwerte[sensordatavalue.value_type].min)){
                            if(sortedData[sensordatavalue.value_type]){
                            
                                newFormat.sensordatavalues[sensordatavalue.value_type] = sensordatavalue.value;
                                sortedData[sensordatavalue.value_type].push(newFormat);
                            } else {
                                sortedData[sensordatavalue.value_type] = []
                                newFormat.sensordatavalues[sensordatavalue.value_type] = sensordatavalue.value;

                                sortedData[sensordatavalue.value_type].push(newFormat);
                            }
                        }
                    });
                })
                return sortedData;
            },

            // generate grid over map with fixed resolution
            generateGrid(mapBounds, cell_count_width){
                // calculate borders 
                let nw = {lat: mapBounds.north, lng: mapBounds.west};
                let ne = {lat: mapBounds.north, lng: mapBounds.east};
                let sw = {lat: mapBounds.south, lng: mapBounds.west};

                var grid =[];

                let cell_width = this.calcCellWidth(mapBounds, cell_count_width)                
                let cell_count_height =  Math.round(this.calcCellCountHeight(mapBounds, cell_width));

                // generate tiles nw to se
                for(var i = 0; i<= cell_count_height; i+= 1){
                    for(var j = 0; j<=cell_count_width; j+=1){
                        let cellBounds = {
                            north: mapBounds.north - i*cell_width,
                            south: mapBounds.north - (i+1)*cell_width,
                            west: mapBounds.west + j*cell_width,
                            east: mapBounds.west + (j+1)*cell_width,
                            coord: [i,j]
                            
                        }

                        grid.push(cellBounds);
                    }
                }

                return grid;
            },

            // calculate with of the cell in deg lat
            calcCellWidth(mapBounds, cell_count_width) {
                let cell_width = Math.abs( (mapBounds.east - mapBounds.west) / cell_count_width );
                return cell_width
            },

            // calculate cell count for y axis
            calcCellCountHeight(mapBounds, cell_width) {
                return Math.floor((mapBounds.north - mapBounds.south) / cell_width);     
            },

            // generate Interpolated Tiles via the PureScript Algorithm
            insertSensorsPurescript(sensors, type,  mapBounds, cell_count_width) {

                // create sensor objects
                const ps_sensors = sensors.map((old) => Tiles.createCoordSensor(old.location.latitude, old.location.longitude, old.sensordatavalues[type]));

                // create matrix
                const ps_mapbounds = Tiles.createMapBounds(mapBounds.north, mapBounds.south, mapBounds.west, mapBounds.east);
                const ps_matrix = Tiles.initCoordMatrix(ps_mapbounds, cell_count_width);

                // insert sensors
                const with_sensors = Tiles.insertManyCoordSensors(ps_sensors, ps_matrix);

                // parse coordMatrix to usable JSON
                let interpolatedTiles = this.parseCoordMatrix(with_sensors.value0);
                return interpolatedTiles;
            },

            // parse "Three" Tree from coordMatrix
            handleThree(tile){
                var values = [];
                values.push({sensorsValue: tile.value2.value1, weight: tile.value2.value0});
                values.push({sensorsValue: tile.value5.value1, weight: tile.value5.value0});
                return values;
            },

            // parse "Two" Tree from coordMatrix
            handleTwo(tile){
                var values = [];
                for( let entry in tile){
                    let type = tile[entry].__proto__.constructor.name;
                    
                    // recursive call for nested "Two" Tree
                    if(type == "Two"){
                        let a1 = this.handleTwo(tile[entry]);
                        a1.forEach( v => {values.push(v)});

                    // call handleThree to parse "Three" Tree
                    } else if (type =="Three"){
                        let a2 = this.handleThree(tile[entry]);
                        a2.forEach( v => {values.push(v)});

                    // parse Tuple
                    } else if (type == "Tuple") {
                        values.push({sensorsValue: tile[entry].value1, weight: tile[entry].value0});
                    }
                }
                return values;
            }, 

            // parse coordMatrix returned from PureScript Tiles Algorithm
            parseCoordMatrix(coordMatrix){
                let cellWidth = coordMatrix.value0;
                let size = coordMatrix.value2.size;

                let parsed = coordMatrix.value2.values.map( tile => {
                    let kind = tile.__proto__.constructor.name;
                    // distinguish between Sensor Tiles, only habe one value and shall not be altered and interpolated Tiles
                    switch (kind) {
                        case "SensorTile":
                            return {
                                kind: kind,
                                values: [ { sensorValue: tile.value0, weight: 1 }]
                            }

                        case "Interpolated":
                            var values = [];
                            let kind2 = tile.value0.__proto__.constructor.name;
                            if(kind2 == "Three"){
                                let v1 = this.handleThree(tile.value0);
                                v1.forEach( s => { values.push(s)});
                            } else if (kind2 == "Two"){
                                let v2 = this.handleTwo(tile.value0);
                                v2.forEach( s => { values.push(s)});
                            }
                            return {

                                kind: kind,
                                values:  values
                            }
                    }
                });
                return parsed;
            },

            // map parsed coordMatrix with generated Grid
            mapGrid(grid, interpolated, sensorType){
                let features = grid.features;

                for (let i = 0; i < interpolated.length; i++) {

                    if(interpolated[i].kind == "SensorTile"){

                        // normalize sensor value based on their threshold
                        let normValue = this.normalize(interpolated[i].values[0].sensorValue, this.grenzwerte[sensorType]["min"], this.grenzwerte[sensorType]["max"]);

                        // get color hex value based on normalized Value & set add to feature property
                        features[i].properties.color = this.colorGradient(normValue*100, sensorType);
                        features[i].properties["value"] = interpolated[i].values[0].sensorValue;
                        features[i].properties["norm_value"] = normValue;
                    
                    } else {
                        
                        // calculate inverse distance interpolation and normalize value, get color 
                        let tileValue = this.inverseDistanceInterpolation(interpolated[i].values);
                        let normValue = this.normalize(tileValue, this.grenzwerte[sensorType]["min"], this.grenzwerte[sensorType]["max"]);
                        features[i].properties.color = this.colorGradient(normValue*100, sensorType);
                        features[i].properties["influence"] = interpolated[i].values;
                        features[i].properties["value"] = tileValue;
                        features[i].properties["norm_value"] = normValue;
                    }
                }
                return grid;
            },

            // calculate value for interpolated tiles
            inverseDistanceInterpolation(values){
                let z = 0;
                values.forEach(value => {
                    let p = ((1/value.weight)*value.sensorsValue);
                    z += p;
                })
                let n = 0

                values.forEach(value => {
                    let p = (1/value.weight);
                    n += p;
                })

                let tileValue = z/n;
                return tileValue;
            },

            // normalize values based on their treshold
            normalize(value, min, max){
                let norm = (value - min)/(max - min);
                if (norm > 1){
                    norm = 1;
                }
                return norm;
            },

            // generate color for a value on a gradient, based on sensortype
            colorGradient(percent, type) {
                let index = Math.floor(percent)-1
                let pressure = ["#0300fc","#0500fa","#0800f7","#0a00f5","#0d00f2","#0f00f0","#1200ed","#1400eb","#1700e8","#1900e6","#1c00e3","#1e00e1","#2100de","#2300dc","#2600d9","#2800d7","#2b00d4","#2d00d2","#3000cf","#3200cd","#3500ca","#3800c7","#3a00c5","#3d00c2","#3f00c0","#4200bd","#4400bb","#4700b8","#4900b6","#4c00b3","#4e00b1","#5100ae","#5300ac","#5600a9","#5800a7","#5b00a4","#5d00a2","#60009f","#62009d","#65009a","#680097","#6a0095","#6d0092","#6f0090","#72008d","#74008b","#770088","#790086","#7c0083","#7e0081","#81007e","#83007c","#860079","#880077","#8b0074","#8d0072","#90006f","#92006d","#95006a","#970068","#9a0065","#9d0062","#9f0060","#a2005d","#a4005b","#a70058","#a90056","#ac0053","#ae0051","#b1004e","#b3004c","#b60049","#b80047","#bb0044","#bd0042","#c0003f","#c2003d","#c5003a","#c70038","#ca0035","#cd0032","#cf0030","#d2002d","#d4002b","#d70028","#d90026","#dc0023","#de0021","#e1001e","#e3001c","#e60019","#e80017","#eb0014","#ed0012","#f0000f","#f2000d","#f5000a","#f70008","#fa0005","#fc0003"];
                let pollution = ["#05fa00","#0af500","#0ff000","#14eb00","#19e600","#1ee100","#23dc00","#28d700","#2dd200","#32cd00","#37c800","#3cc300","#41be00","#46b900","#4bb400","#50af00","#55aa00","#5aa500","#5fa000","#649b00","#699600","#6e9100","#738c00","#788700","#7d8200","#827d00","#877800","#8c7300","#916e00","#966900","#9b6400","#a05f00","#a55a00","#aa5500","#af5000","#b44b00","#b94600","#be4100","#c33c00","#c83700","#cd3200","#d22d00","#d72800","#dc2300","#e11e00","#e61900","#eb1400","#f00f00","#f50a00","#fa0500", "#fb0001","#f60003","#f20004","#ee0005","#ea0006","#e50008","#e10009","#dd000a","#d8000c","#d4000d","#d0000e","#cb0010","#c70011","#c30012","#bf0013","#ba0015","#b60016","#b20017","#ad0019","#a9001a","#a5001b","#a1001c","#9c001e","#98001f","#940020","#8f0022","#8b0023","#870024","#820026","#7e0027","#7a0028","#760029","#71002b","#6d002c","#69002d","#64002f","#600030","#5c0031","#580032","#530034","#4f0035","#4b0036","#460038","#420039","#3e003a","#39003c","#35003d","#31003e","#2d003f","#280041"]
                let temperature = ["#0005fa","#000af5","#000ff0","#0014eb","#0019e6","#001ee1","#0023dc","#0028d7","#002dd2","#0032cd","#0037c8","#003cc3","#0041be","#0046b9","#004bb4","#0050af","#0055aa","#005aa5","#005fa0","#00649b","#006996","#006e91","#00738c","#007887","#007d82","#00827d","#008778","#008c73","#00916e","#009669","#009b64","#00a05f","#00a55a","#00aa55","#00af50","#00b44b","#00b946","#00be41","#00c33c","#00c837","#00cd32","#00d22d","#00d728","#00dc23","#00e11e","#00e619","#00eb14","#00f00f","#00f50a","#00fa05", "#05fa00","#0af500","#0ff000","#14eb00","#19e600","#1ee100","#23dc00","#28d700","#2dd200","#32cd00","#37c800","#3cc300","#41be00","#46b900","#4bb400","#50af00","#55aa00","#5aa500","#5fa000","#649b00","#699600","#6e9100","#738c00","#788700","#7d8200","#827d00","#877800","#8c7300","#916e00","#966900","#9b6400","#a05f00","#a55a00","#aa5500","#af5000","#b44b00","#b94600","#be4100","#c33c00","#c83700","#cd3200","#d22d00","#d72800","#dc2300","#e11e00","#e61900","#eb1400","#f00f00","#f50a00","#fa0500"]
                
                if( type == "P1" || type == "P2"){
                    let r = percent<50 ? 255 : Math.floor(255-(percent*2-100)*255/100);
                    let g = percent>50 ? 255 : Math.floor((percent*2)*255/100);
                    return 'rgb('+g+','+r+',0)';                
                } else if ((type == "humidity" || type == "pressure")  && index <= temperature.length) {
                    return pressure[index];
                } else if (type == "temperature" && index <= temperature.length){
                    return temperature[index];
                } else {
                    return null;
                }

            },

            // initialize legend div
            initLegend(map){
                var menuUI = document.getElementById('legend');
                menuUI.style.backgroundColor = '#fff';
                menuUI.style.border = '2px solid #fff';
                menuUI.style.borderRadius = '3px';
                menuUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
                menuUI.style.cursor = 'pointer';
                menuUI.style.marginBottom = '22px';
                menuUI.style.textAlign = 'left';
                menuUI.style.fontFamily = 'Roboto,Arial,sans-serif';
                menuUI.style.fontSize = '18px';
                menuUI.style.padding = '0px 17px';
                menuUI.style.verticalAlign = 'middle';

                menuUI.innerHTML = "Legend";
                menuUI.style.fontWeight = 'bold';
                menuUI.index = 1;
                map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(menuUI);
            },

            // generate legend for sensortype
            generateLegend(type){
                let min=  this.grenzwerte[type].min;
                let max=  this.grenzwerte[type].max;
                var div = L.DomUtil.create('div', 'info legend');
                let gradesStep = (max-min)/10;
                let grades = [];
                for(let i = 0; i < 10; i++){
                    grades.push(min+gradesStep*i)
                }
                let labels = ["<strong> "+ this.grenzwerte[type].metric +" </strong>"], from, to;

                for (var i = 0; i < grades.length; i++) {
                    from = grades[i];
                    to = grades[i + 1];
                    
                    let color = this.colorGradient(this.normalize(from + 1, min, max)*100, type);
                    labels.push(
                    '<i style="background:' + color + '"></i> ' +
                    from + (to ? '&ndash;' + to : '+'));
                }
                div.innerHTML = labels.join('<br>');
                return div;
                
            },

            // initialize controls to switch between data layers
            initCustomControls(map){
            
                var menuUI = document.getElementById('controls');
                menuUI.style.backgroundColor = '#fff';
                menuUI.style.border = '2px solid #fff';
                menuUI.style.borderRadius = '3px';
                menuUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
                menuUI.style.cursor = 'pointer';
                menuUI.style.marginBottom = '22px';
                menuUI.style.textAlign = 'left';
                menuUI.style.fontFamily = 'Roboto,Arial,sans-serif';
                menuUI.style.fontSize = '18px';
                menuUI.style.padding = '0px 17px';
                menuUI.style.verticalAlign = 'middle';

                menuUI.innerHTML = "Layer Control";
                menuUI.style.fontWeight = 'bold';
                menuUI.index = 1;
                map.controls[google.maps.ControlPosition.RIGHT_TOP].push(menuUI);
                

            },

            // add cotrols for every data layer
            addControlItem(layer, text, map){
                
                var controlText = document.createElement('div');
                controlText.style.textAlign = 'left';
                document.getElementById("controls").appendChild(controlText);


                var layerCheck = document.createElement('input');
   
                layerCheck.type = "checkbox";
                layerCheck.name = "layerCheck";
                layerCheck.value = "value";
                layerCheck.id = "layerCheck";
                controlText.appendChild(layerCheck);
                
                var label = document.createElement('label')
                label.htmlFor = "layerCheck";
                label.style.fontWeight = 'normal';

                label.appendChild(document.createTextNode(text + ' Layer'));
                controlText.appendChild(label);

                let legend = this.generateLegend(text);

                // setup click events: show/hide data layer & legend
                layerCheck.addEventListener('click', () => {
                    if(layerCheck.checked){
                        layer.setMap(map);
                        document.getElementById("legend").appendChild(legend);

                        
                    } else {
                        layer.setMap(null);
                        document.getElementById("legend").removeChild(legend);

                    }
                 });
            },

            // add markers for sensors
            addMarkerButton(sensors, type, map){
                var controlText = document.createElement('div');
                controlText.style.textAlign = 'left';
                controlText.style.paddingLeft = '15px'
                controlText.style.borderBottom = '1px'
                controlText.style.borderBottomColor = 'grey'                

                document.getElementById("controls").appendChild(controlText);
                var markerRadio = document.createElement('input');

                markerRadio.type = "checkbox";
                markerRadio.name = "layerCheck";
                markerRadio.value = "value";
                markerRadio.id = "layerCheck";
                controlText.appendChild(markerRadio);
                
                var label = document.createElement('label')
                label.htmlFor = "markerRadio";
                label.style.fontWeight = 'normal';
                label.style.fontSize = '14';
                
                label.appendChild(document.createTextNode('Sensors'));
                controlText.appendChild(label);
                let markers = this.createSensorMarker(sensors, type, map);
                markerRadio.addEventListener('click', () => {
                    if(markerRadio.checked){
                        markers.forEach(marker => {
                            marker.setMap(map);
                        })
                        
                    } else {
                        markers.forEach(marker => {
                            marker.setMap(null);
                        })
                    }
                });

            },

            // add weather stations to map and calculate wind direction & speed
            addWeatherData(map){
                // fetch weatherData and add Stations to map
                let weatherData = this.fetchJSON("http://api.openweathermap.org/data/2.5/find?lat=48.7758459&lon=9.1829321&cnt=15&units=metric&appid=9ed58223d2e011bd45529508e9b9d8b6");
                weatherData.then( data => {

                    for(var sensor of data.list){

                        // create Infobox for station
                        let weatherConditionInfo = 
                            '<div id=weatherBox>'+
                            '<h3>'+sensor.name+'</h3>' +
                            '<p>Temperatur: ' + sensor.main.temp + ' C°</p>' +
                            '<p>Gefühlt: ' + sensor.main.feels_like + ' C°</p>' +
                            '<p>Lufdruck: ' + sensor.main.pressure + ' hPa</p>' +
                            '<p>Luftfeuchtigkeit: ' + sensor.main.humidity + '%</p>' +
                            '<b>Windgeschwindigkeit: ' + sensor.wind.speed + ' m/s</b>' +
                            '</div>';

                        let infoWindow = new google.maps.InfoWindow({ 
                            content: weatherConditionInfo});

                        // create arrow indicating wind speed & direction
                        let windArrow = {
                            path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                            strokeColor: '#141414'
                        };

                        // calculate wind direction and draw arrow on map
                        if(sensor.wind.deg){
                            let lineFactor = this.calcLengthFactor(sensor.wind.speed);
                            let endpoint = this.rotation(sensor.coord.lon, sensor.coord.lat+lineFactor, sensor.coord, sensor.wind.deg);
                            let windLine = new google.maps.Polyline({
                                path: [{lat: sensor.coord.lat, lng: sensor.coord.lon}, endpoint],
                                icons: [{
                                    icon: windArrow,
                                    offset: '100%'
                                }],
                                strokeColor: '#141414',
                                strokeWeight: 3,
                                strokeOpacity: 1,
                                map: map
                            });
                            //this.animateWindLine(windLine, lineFactor);
                        };

                        // draw weather station marker on map
                        let marker = new google.maps.Marker({
                            position: {lat: sensor.coord.lat, lng: sensor.coord.lon} ,
                            icon: "http://openweathermap.org/img/w/" + sensor.weather[0].icon + ".png",
                            map: map,
                            title: sensor.name
                        });

                        // add functionality to station marker
                        var opened = false;
                        marker.addListener('click', function() {
                            if(opened){
                                infoWindow.close()
                                opened = false;
                            } else {
                                infoWindow.open(map, marker);
                                opened = true;

                            }
                        });
                    }
                });
            },
            // rotate point with lng=x, lat=y around point = p with angle = deg
            rotation(x, y, p, deg){

                let rad = deg * Math.PI / 180;

                let s = Math.sin(rad);
                let c = Math.cos(rad);

                // translate point back to origin:
                x -= p.lon;
                y -= p.lat;

                // rotate point
                let xnew = x * c - y * s;
                let ynew = x * s - y * c;
                
                // translate point back:
                x = xnew + p.lon;
                y = ynew + p.lat;

                return {lat: y, lng:  x}

            },

            // calculate lenght factor for wind direction arrow (higher wind speed => bigger factor => longer arrow)
            calcLengthFactor(windspeed){
                let maxFactor = 0.02;
                let minSpeed = 0;
                let maxSpeed = 15;
                let normSpeed = (windspeed - minSpeed)/(maxSpeed-minSpeed);

                return maxFactor*normSpeed;

            },

            // animate arrowhead along arrow shaft, factor generates speed
            animateWindLine(line, factor) {
                var count = 0;
                window.setInterval(function() {
                    count = (count + 1) % 200;

                    var icons = line.get('icons');
                    icons[0].offset = (count / 2) + '%';
                    line.set('icons', icons);
                }, 200*factor);
            },

            // create geoJson based on sorted sensor Data => easier to visualize
            createGeoJson(jsonArray){
                var geojson = {
                    "name":"NewFeatureType",
                    "type":"FeatureCollection",
                    "features":[]
                };

                jsonArray.forEach( cell => {
                    var feature = {
                        "type":"Feature",
                        "properties": {
                            "color": "#fff",
                            "coord": cell.coord
                        },
                        "geometry":{
                            "type":"Polygon",
                            "coordinates":[
                                [
                                    [cell.west, cell.north],
                                    [cell.west, cell.south],
                                    [cell.east, cell.south],
                                    [cell.east, cell.north],
                                    [cell.west, cell.north],

                                ]
                            ]
                        },
  
                    };
                    geojson.features.push(feature);
                });
                return geojson;
            },

            // create data layer for each sensorType
            createLayer(geoJson, map){
                var newLayer = new google.maps.Data();
                newLayer.addGeoJson(geoJson);
                newLayer.setStyle(function(feature) {
                    return({
                        fillColor: feature.getProperty("color"),
                        fillOpacity: 0.3,
                        strokeWeight: 1,
                        strokeOpacity: 0,
                        visible: true,
                    })
                })

                var opened = false;
                
                newLayer.addListener('click',event => {
                    let coord = event.feature.getProperty("coord") ;
                    let infoWindowContent = '<div><h3>Tile '+ coord[0] + " | " + coord[1]+'</h3>' +
                        '<p>Tile value: ' + event.feature.getProperty("value") + '</p>' + '</div>';
                    let infoWindow = new google.maps.InfoWindow({ 
                        content: infoWindowContent,
                        position: event.latLng});
                    if(!opened){
                        infoWindow.open(map);
                        opened = true;
                    } else {
                        infoWindow.close();
                        opened = false;
                    }
                })
                return newLayer;
            },

            // create sensor markers for sensortype
            createSensorMarker(sensors, type, map){
                let markers = [];
                // Create markers.
                sensors.forEach(sensor => {
                        // create marker for each sensor
                        let marker = new google.maps.Marker({
                            position:{lat: parseFloat(sensor.location.latitude), lng: parseFloat(sensor.location.longitude)},
                            title: sensor.name,
                        });

                        // create pop up window
                        let sensorInformation = '<div id=sensorBox>'+
                            '<h3>'+ sensor.sensor.sensor_type.manufacturer + ", " + sensor.sensor.sensor_type.name +'</h3>' +
                            '<p>Messwert: ' + sensor.sensordatavalues[type] + " " + this.grenzwerte[type].metric +'</p>' +
                            '<p>' + sensor.location.latitude + ", " + sensor.location.longitude + '</p>' +
                            // '<p>Lufdruck: ' + sensor.main.pressure + ' hPa</p>' +
                            // '<p>Luftfeuchtigkeit: ' + sensor.main.humidity + '%</p>' +
                            // '<b>Windgeschwindigkeit: ' + sensor.wind.speed + ' km/h</b>' +
                            '</div>';

                        let infoWindow = new google.maps.InfoWindow({ 
                            content: sensorInformation});

                        // add functionality
                        var opened = false;
                        marker.addListener('click', function() {
                            if(opened){
                                infoWindow.close()
                                opened = false;
                            } else {
                                infoWindow.open(map, marker);
                                opened = true;

                            }
                        });
                    markers.push(marker);
                });
                return markers;
            }
        }
    }
</script>
<style scoped></style>