<template>

    <div class="google-map">
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
                gridWidth: 76,
                layers: {},
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
 
                // // set Map Options and Zoom
                // map.setOptions({
                //     minZoom: 13,
                //     restriction: {
                //         latLngBounds: mapBounds
                //     }
                // });

                var grid = this.getGrid2(mapBounds, this.gridWidth);
                var geojson = this.createGeoJson(grid);


                // add trafficlayer to map
                let trafficLayer = new google.maps.TrafficLayer;
                trafficLayer.setMap(map);

                // // fetch weatherData and add Stations to map
                // let weatherData = this.fetchJSON("http://api.openweathermap.org/data/2.5/find?lat=48.7758459&lon=9.1829321&cnt=15&units=metric&appid=9ed58223d2e011bd45529508e9b9d8b6");
                // weatherData.then( data => {

                //     for(var sensor of data.list){

                //         // create Infobox for station
                //         let weatherConditionInfo = 
                //             '<div id=weatherBox>'+
                //             '<h3>'+sensor.name+'</h3>' +
                //             '<p>Temperatur: ' + sensor.main.temp + ' C°</p>' +
                //             '<p>Gefühlt: ' + sensor.main.feels_like + ' C°</p>' +
                //             '<p>Lufdruck: ' + sensor.main.pressure + ' hPa</p>' +
                //             '<p>Luftfeuchtigkeit: ' + sensor.main.humidity + '%</p>' +
                //             '<b>Windgeschwindigkeit: ' + sensor.wind.speed + ' m/s</b>' +
                //             '</div>';

                //         let infoWindow = new google.maps.InfoWindow({ 
                //             content: weatherConditionInfo});

                //         // create arrow indicating wind speed & direction
                //         let windArrow = {
                //             path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                //             strokeColor: '#141414'
                //         };

                //         // calculate wind direction and draw arrow on map
                //         if(sensor.wind.deg){
                //             let lineFactor = this.calcLengthFactor(sensor.wind.speed);
                //             let endpoint = this.rotation(sensor.coord.lon, sensor.coord.lat+lineFactor, sensor.coord, sensor.wind.deg);
                //             let windLine = new google.maps.Polyline({
                //                 path: [{lat: sensor.coord.lat, lng: sensor.coord.lon}, endpoint],
                //                 icons: [{
                //                     icon: windArrow,
                //                     offset: '100%'
                //                 }],
                //                 strokeColor: '#141414',
                //                 strokeWeight: 3,
                //                 strokeOpacity: 1,
                //                 map: map
                //             });
                //             //this.animateWindLine(windLine, lineFactor);
                //         };

                //         // draw weather station marker on map
                //         let marker = new google.maps.Marker({
                //             position: {lat: sensor.coord.lat, lng: sensor.coord.lon} ,
                //             icon: "http://openweathermap.org/img/w/" + sensor.weather[0].icon + ".png",
                //             map: map,
                //             title: sensor.name
                //         });

                //         // add functionality to station marker
                //         var opened = false;
                //         marker.addListener('click', function() {
                //             if(opened){
                //                 infoWindow.close()
                //                 opened = false;
                //             } else {
                //                 infoWindow.open(map, marker);
                //                 opened = true;

                //             }
                //         });
                //     }
                // });



                // fetch current (<5 min) air data
                var currentSensorData = this.fetchJSON("https://data.sensor.community/airrohr/v1/filter/box="+ mapBounds.north + "," + mapBounds.east + "," + mapBounds.south + "," + mapBounds.west);
                currentSensorData.then(data => {

                    // sort air data after value_types (temperature, pressure, P1/P2 pollution)
                    var sortedData = this.sortSensorData(data);
                    let interpolated = this.insertSensorsPurescript(sortedData["P1"],mapBounds, this.gridWidth);
                    geojson = this.mapGrid(geojson, interpolated);

                    let p1layer = this.createLayer(geojson, map);

                    var controlDiv = document.createElement('div');
                    var customControl = new this.initCustomControls(controlDiv, p1layer, 'P1', map);
                    controlDiv.index = 1;
                    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(controlDiv);

                    sortedData["P1"].forEach(sensor => {
                        
                        if(sensor.sensordatavalues.P1 > 0){
                            // create marker for each sensor
                            let marker = new google.maps.Marker({
                                position:{lat: parseFloat(sensor.location.latitude), lng: parseFloat(sensor.location.longitude)},
                                map: map,
                                title: sensor.name
                            });

                            // create pop up window
                            let sensorInformation = '<div id=sensorBox>'+
                                '<h3>'+ sensor.sensor.sensor_type.manufacturer + ", " + sensor.sensor.sensor_type.name +'</h3>' +
                                '<p>Messwert: ' + sensor.sensordatavalues.P1 + '</p>' +
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
                    console.log(response);
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


            // calculate distance in m between two lat/lng points
            meterLength(point1, point2){
                var R = 6378.137; // Radius of earth in KM
                var dLat = point2.lat * Math.PI / 180 - point1.lat * Math.PI / 180;
                var dLon = point2.lng * Math.PI / 180 - point1.lng * Math.PI / 180;
                var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                var d = R * c;
                return d * 1000; // meters
            },


            metersToDeg(meter){
                let o = 0.00000898311;
                return meter * o;

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
                console.log("Resolution: " + cell_count_width + "x" + cell_count_height);          
                
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

            insertSensorsPurescript(sensors, mapBounds, cell_count_width) {
                // create sensor objects
                const ps_sensors = sensors.map((old) => Tiles.createCoordSensor(old.location.latitude, old.location.longitude, old.sensordatavalues.P1));

                //create matrix
                const ps_mapbounds = Tiles.createMapBounds(mapBounds.north, mapBounds.south, mapBounds.west, mapBounds.east);
                const ps_matrix = Tiles.initCoordMatrix(ps_mapbounds, cell_count_width);

                //insert sensors
                const with_sensors = Tiles.insertManyCoordSensors(ps_sensors, ps_matrix);

                console.log(with_sensors);
                let interpolatedTiles = this.parseCoordMatrix(with_sensors.value0);
                // let as_json = Tiles.jsonify(with_sensors);
                    // console.log(as_json);
                return interpolatedTiles;
                    
            },

            handleThree(tile){
                var values = [];
                values.push({sensorsValue: tile.value2.value1, weight: tile.value2.value0});
                values.push({sensorsValue: tile.value5.value1, weight: tile.value5.value0});
                return values;
            },

            handleTwo(tile){
                // console.log(tile)
                var values = [];
                for( let entry in tile){
                    let type = tile[entry].__proto__.constructor.name;
                    // console.log(type);
                    // console.log(tile.value0[entry]);
                    if(type == "Two"){
                        // console.log("GO RECURSIVE");
                        let a1 = this.handleTwo(tile[entry]);
                        // console.log("A1",a1)
                        a1.forEach( v => {values.push(v)});
                    } else if (type =="Three"){
                        let a2 = this.handleThree(tile[entry]);
                        // console.log("A2",a2)
                        a2.forEach( v => {values.push(v)});
                    } else if (type == "Tuple") {
                        // console.log("A3",{sensorsValue: tile[entry].value1, weight: tile[entry].value0})
                        values.push({sensorsValue: tile[entry].value1, weight: tile[entry].value0});
                    }
                }
                // console.log(values);
                return values;
            }, 


            parseCoordMatrix(coordMatrix){
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
                            //console.log(tile)
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
                console.log(grid);
                let features = grid.features;
                console.log(interpolated);
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
                        // console.log("RAW",tileValue);
                        // console.log("NORM",normValue);
                        let normValue = this.normalize(tileValue, 0, 50);
                        features[i].properties.color = this.colorGradient(normValue*100);
                        features[i].properties["influence"] = interpolated[i].values;
                        features[i].properties["value"] = tileValue;
                        features[i].properties["norm_value"] = normValue;


                        // console.log(features[i].properties.color);
                    }
                    
                }
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

            initCustomControls(controlDiv, layer, text, map){
                
                var menuUI = document.createElement('div');
                menuUI.title = 'Click to recenter the map';


                var controlUI = document.createElement('div');
                controlUI.style.backgroundColor = '#fff';
                controlUI.style.border = '2px solid #fff';
                controlUI.style.borderRadius = '3px';
                controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
                controlUI.style.cursor = 'pointer';
                controlUI.style.marginBottom = '22px';
                controlUI.style.textAlign = 'center';
                controlUI.title = 'Click to toggle ' + text + 'Layer';
                controlDiv.appendChild(controlUI);

                var controlText = document.createElement('div');
                controlText.style.color = 'rgb(25,25,25)';
                controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
                controlText.style.fontSize = '16px';
                controlText.style.lineHeight = '38px';
                controlText.style.paddingLeft = '5px';
                controlText.style.textAlign = 'left';
                controlText.style.paddingRight = '5px';
                controlText.innerHTML = 'Toggle ' + text;
                controlUI.appendChild(controlText);
                // console.log(layers);

                let toggled = false;
                console.log(layer);

                // Setup the click event listeners: simply set the map to Chicago.
                controlUI.addEventListener('click', function() {
                    if(toggled == false){
                        toggled = true;
                        layer.setMap(map);
                    } else {
                        toggled = false;
                        layer.setMap(null);
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
                        fillOpacity: 1,
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

            getRandomColor() {
                var letters = '0123456789ABCDEF';
                var color = '#';
                for (var i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            },
            
        }
    }
</script>

<style scoped></style>