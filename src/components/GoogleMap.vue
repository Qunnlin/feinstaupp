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
                layers: {},
                markers: []
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
                    minZoom: 13,
                    restriction: {
                        latLngBounds: mapBounds
                    }
                });
                this.initCustomControls(map);
                var grid = this.getGrid2(mapBounds, this.gridWidth);
                var geojson = this.createGeoJson(grid);


                // add trafficlayer to map
                let trafficLayer = new google.maps.TrafficLayer;
                trafficLayer.setMap(map);

                this.addWeatherData(map);
                // fetch current (<5 min) air data
                var currentSensorData = this.fetchJSON("https://data.sensor.community/airrohr/v1/filter/box="+ mapBounds.north + "," + mapBounds.east + "," + mapBounds.south + "," + mapBounds.west);
                currentSensorData.then(data => {

                    // sort air data after value_types (temperature, pressure, P1/P2 pollution)
                    var sortedData = this.sortSensorData(data);
                    console.log(sortedData);



                    // // P1 Sensors
                    // let sensorType = "P1";

                    // // generate interpolated data & update geoJson
                    // let p1_interpolated = this.insertSensorsPurescript(sortedData[sensorType], sensorType, mapBounds, this.gridWidth);
                    // let p1_geojson = this.mapGrid(geojson, p1_interpolated);

                    // // create Layer
                    // let p1_layer = this.createLayer(p1_geojson, map);

                    // // create controls
                    
                    // this.addControlItem(p1_layer,"P1", map)



                    // // P2 Sensors
                    // sensorType = "P2";

                    // // generate interpolated data & update geoJson
                    // let p2_interpolated = this.insertSensorsPurescript(sortedData[sensorType], sensorType, mapBounds, this.gridWidth);
                    // let p2_geojson = this.mapGrid(geojson, p2_interpolated);

                    // // create Layer
                    // let p2_layer = this.createLayer(p2_geojson, map);

                    // // create controls
                    
                    // this.addControlItem(p2_layer,"P2", map)



                //    // humidity Sensors
                //     let sensorType = "humidity";
                //     this.createSensorMarker(sortedData[sensorType], sensorType, map);

                //     // generate interpolated data & update geoJson
                //     let h_interpolated = this.insertSensorsPurescript(sortedData[sensorType],mapBounds, this.gridWidth);
                //     let h_geojson = this.mapGrid(geojson, h_interpolated);

                //     // create Layer
                //     let h_layer = this.createLayer(h_geojson, map);

                //     // create controls
                    
                //     this.addControlItem(h_layer,"Humidity", map)



                //     // Temperatur Sensors
                //     sensorType = "temperature";

                //     // generate interpolated data & update geoJson
                //     let t_interpolated = this.insertSensorsPurescript(sortedData[sensorType],mapBounds, this.gridWidth);
                //     let t_geojson = this.mapGrid(geojson, t_interpolated);

                //     // create Layer
                //     let t_layer = this.createLayer(t_geojson, map);

                //     // create controls
                    
                //     this.addControlItem(t_layer,"Temperature", map)



                    // Pressure Sensors
                    let sensorType = "pressure";

                    // generate interpolated data & update geoJson
                    let p_interpolated = this.insertSensorsPurescript(sortedData[sensorType],mapBounds, this.gridWidth);
                    let p_geojson = this.mapGrid(geojson, p_interpolated);

                    // create Layer
                    let p_layer = this.createLayer(p_geojson, map);

                    // create controls
                    
                    this.addControlItem(p_layer,"Pressure", map)


  
                });                
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
                        if(sortedData[sensordatavalue.value_type]){
                            newFormat.sensordatavalues[sensordatavalue.value_type] = sensordatavalue.value;
                            sortedData[sensordatavalue.value_type].push(newFormat);
                        } else {
                            sortedData[sensordatavalue.value_type] = []
                            newFormat.sensordatavalues[sensordatavalue.value_type] = sensordatavalue.value;

                            sortedData[sensordatavalue.value_type].push(newFormat);
                        }
                    });
                })
                return sortedData;
            },

            // generate grid over map with fixed resolution
            getGrid2(mapBounds, cell_count_width){
                let nw = {lat: mapBounds.north, lng: mapBounds.west};
                let ne = {lat: mapBounds.north, lng: mapBounds.east};
                let sw = {lat: mapBounds.south, lng: mapBounds.west};
                // let se = {lat: mapBounds.south, lng: mapBounds.east};
                
                var grid =[];
                let cell_width = this.calc_cell_width(mapBounds, cell_count_width)                
                let cell_count_height =  Math.round(this.calc_cell_count_height(mapBounds, cell_width));

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

            calc_cell_width(mapBounds, cell_count_width) {
                let cell_width = Math.abs( (mapBounds.east - mapBounds.west) / cell_count_width );
                return cell_width
            },

            calc_cell_count_height(mapBounds, cell_width) {
                return Math.floor((mapBounds.north - mapBounds.south) / cell_width);     
            },

            insertSensorsPurescript(sensors, type,  mapBounds, cell_count_width) {
                // create sensor objects
                const ps_sensors = sensors.map((old) => Tiles.createCoordSensor(old.location.latitude, old.location.longitude, old.sensordatavalues[type]));

                //create matrix
                const ps_mapbounds = Tiles.createMapBounds(mapBounds.north, mapBounds.south, mapBounds.west, mapBounds.east);
                const ps_matrix = Tiles.initCoordMatrix(ps_mapbounds, cell_count_width);

                //insert sensors
                const with_sensors = Tiles.insertManyCoordSensors(ps_sensors, ps_matrix);

                console.log(with_sensors);
                let interpolatedTiles = this.parseCoordMatrix(with_sensors.value0);
                return interpolatedTiles;
                    
            },

            handleThree(tile){
                var values = [];
                values.push({sensorsValue: tile.value2.value1, weight: tile.value2.value0});
                values.push({sensorsValue: tile.value5.value1, weight: tile.value5.value0});
                return values;
            },

            handleTwo(tile){

var values = [];
                for( let entry in tile){
                    let type = tile[entry].__proto__.constructor.name;

                    if(type == "Two"){
                        let a1 = this.handleTwo(tile[entry]);
                        a1.forEach( v => {values.push(v)});
                    } else if (type =="Three"){
                        let a2 = this.handleThree(tile[entry]);
                        a2.forEach( v => {values.push(v)});
                    } else if (type == "Tuple") {
                        values.push({sensorsValue: tile[entry].value1, weight: tile[entry].value0});
                    }
                }
                return values;
            }, 


            parseCoordMatrix(coordMatrix){
                console.log(coordMatrix);
                let cellWidth = coordMatrix.value0;
                let size = coordMatrix.value2.size;
                let parsed = coordMatrix.value2.values.map( tile => {
                    let kind = tile.__proto__.constructor.name;
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

            mapGrid(grid, interpolated){
                let features = grid.features;
                for (let i = 0; i < interpolated.length; i++) {

  
                    if(interpolated[i].kind == "SensorTile"){
                        let normValue = this.normalize(interpolated[i].values[0].sensorValue, 0, 50);
                        features[i].properties.color = this.colorGradient(normValue*100);
                        features[i].properties["value"] = interpolated[i].values[0].sensorValue;
                        features[i].properties["norm_value"] = normValue;


                    } else {
                        let tileValue = 0;

                        interpolated[i].values.forEach(value => {
                            tileValue += value.sensorsValue/(value.weight+1);
                        })
                        let normValue = this.normalize(tileValue, 0, 50);
                        features[i].properties.color = this.colorGradient(normValue*100);
                        features[i].properties["influence"] = interpolated[i].values;
                        features[i].properties["value"] = tileValue;
                        features[i].properties["norm_value"] = normValue;
                    }
                    
                }
                console.log(grid);
                return grid;
            },
            normalize(value, min, max){
                let norm = (value - min)/(max - min);
                if (norm > 1){
                    norm = 1;
                }
                return norm;
            },

            colorGradient(percent) {
                let r = percent<50 ? 255 : Math.floor(255-(percent*2-100)*255/100);
                let g = percent>50 ? 255 : Math.floor((percent*2)*255/100);
                return 'rgb('+g+','+r+',0)';
            },

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



                // Setup the click event listeners: simply set the map to Chicago.

                layerCheck.addEventListener('click', function() {
                    if(this.checked){
                        layer.setMap(map);
                    } else {
                        layer.setMap(null);
                    }
                 });
            },

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
                            // this.animateWindLine(windLine, lineFactor);
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

            createLayer(geoJson, map){
                var newLayer = new google.maps.Data();
                newLayer.addGeoJson(geoJson);
                newLayer.setStyle(function(feature) {
                    return({
                        fillColor: feature.getProperty("color"),
                        fillOpacity: 0.5,
                        strokeWeight: 1,
                        strokeOpacity: 0,
                        visible: true,
                    })
                })
                newLayer.addListener('click',event => {
                    console.log(event.feature.getProperty("influence"));
                    console.log(event.feature.getProperty("value"));
                    console.log(event.feature.getProperty("norm_value"));
                })
                return newLayer;
            },
            createSensorMarker(sensors, type, map){
                sensors.forEach(sensor => {
                    if(sensor.sensordatavalues[type] > 0){
                        // create marker for each sensor
                        let marker = new google.maps.Marker({
                            position:{lat: parseFloat(sensor.location.latitude), lng: parseFloat(sensor.location.longitude)},
                            title: sensor.name,
                            map: map
                        });

                        // create pop up window
                        let sensorInformation = '<div id=sensorBox>'+
                            '<h3>'+ sensor.sensor.sensor_type.manufacturer + ", " + sensor.sensor.sensor_type.name +'</h3>' +
                            '<p>Messwert: ' + sensor.sensordatavalues[type] + '</p>' +
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
                    }
                });
            }
        }
    }
</script>

<style scoped></style>