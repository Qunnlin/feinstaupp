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
                markers: [],
                places: [],
                currentPlace: null
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

                var controlDiv = document.createElement('div');
                var customControl = new this.initCustomControls(controlDiv, map);
                
                controlDiv.index = 1;
                map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
                
                var pollLayer = new google.maps.Data();
                var test = this.getGrid2(mapBounds, 10);


                var geojson = this.createGeoJson(test);
                console.log(geojson);
                pollLayer.addGeoJson(geojson);
                pollLayer.setStyle(function(feature) {
                    return({
                        fillColor: feature.getProperty("color"),
                        fillOpacity: 0.4
                    })
                })
                pollLayer.setMap(map);

                test.forEach(cell => {

                    var rectangle = new google.maps.Rectangle({
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.2,
                        strokeWeight: 2,
                        fillColor: '#FF0000',
                        fillOpacity: 0.0,
                        map: map,
                        bounds: {
                            north: cell.north,
                            south: cell.south,
                            east: cell.east,
                            west: cell.west
                        }
                    });
                    google.maps.event.addListener(rectangle, 'click', function() {
                        console.log(cell);
                    });

                });


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
                    //var sensorIds = this.extractSensorIds(data);
                    var sortedData = this.sortSensorData(data);
                    this.insertSensorsPurescript(sortedData["P1"],mapBounds,10);

                    console.log(sortedData.P1);
                    // var tiles = this.insertSensors(sortedData["P1"], mapBounds,400)
                    // console.log(tiles);
                    sortedData["P1"].forEach(sensor => {
                        
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
                            // '<p>Gefühlt: ' + sensor.main.feels_like + ' C°</p>' +
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

                    });
  
                });
                
                // // add weather overlay from openweathermaps
                // var myMapType = new google.maps.ImageMapType({
                //     getTileUrl: function(coord, zoom) {
                //         return "https://tile.openweathermap.org/map/wind_new/"+ zoom + "/" + coord.x + "/"+ coord.y + ".png?appid=c6a3ae840aa6d20d4b2bb8985779af1e";
                //     },
                //     tileSize: new google.maps.Size(256, 256),
                //     maxZoom: 9,
                //     minZoom: 0,
                //     name: 'mymaptype'
                // });

                // //map.overlayMapTypes.insertAt(0, myMapType);

                






                
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


            // generate grid over map with fixed cell size (not working correctly)
            getGrid(mapBounds, cellSize){
                let sw = {lat: mapBounds.south, lng: mapBounds.west};
                let se = {lat: mapBounds.south, lng: mapBounds.east};
                let nw = {lat: mapBounds.north, lng: mapBounds.west};
                let ne = {lat: mapBounds.north, lng: mapBounds.east};
                var grid =[];
                for(var i = 0; i<= this.meterLength(nw, ne); i+=cellSize){
                    for(var j = 0; j<=this.meterLength(nw, sw); j+=cellSize){
                        let cellBounds = {
                            north: mapBounds.north - this.metersToDeg(j),
                            south: mapBounds.south - this.metersToDeg(j),
                            west: mapBounds.west + this.metersToDeg(i),
                            east: mapBounds.east + this.metersToDeg(i)
                        }
                        grid.push(cellBounds);

                    }
                }
                return grid;
            },

            correct(p1 , p2) {
                let distance_meters = meterLength(p1, p2);
                let distance_deg = metersToDeg(distance_meters);
                console.log("" + (p1 + distance_deg) + " should be the same as " + p2);
            },

            // generate grid over map with fixed resolution
            getGrid2(mapBounds, cell_count_width){
                let nw = {lat: mapBounds.north, lng: mapBounds.west};
                let ne = {lat: mapBounds.north, lng: mapBounds.east};
                let sw = {lat: mapBounds.south, lng: mapBounds.west};
                // let se = {lat: mapBounds.south, lng: mapBounds.east};
                
                var grid =[];
                let cell_width = this.calc_cell_width(mapBounds, cell_count_width)
                console.log(cell_width);
                
                let cell_count_height =  this.calc_cell_count_height(mapBounds, cell_width);
                console.log("Resolution: " + cell_count_width + "x" + Math.round(cell_count_height));          
                
                for(var i = 0; i<= cell_count_width; i+= 1){
                    for(var j = 0; j<=cell_count_height; j+=1){
                        let cellBounds = {
                            north: mapBounds.north - j*cell_width,
                            south: mapBounds.north - (j+1)*cell_width,
                            west: mapBounds.west + i*cell_width,
                            east: mapBounds.west + (i+1)*cell_width
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
                return Math.round((mapBounds.north - mapBounds.south) / cell_width);     
            },

            insertSensors(sensors, mapBounds, cell_count_width){
                let cell_width = this.calc_cell_width(mapBounds, cell_count_width)
                let cell_count_height = this.calc_cell_count_height(mapBounds, cell_width);
                
                let tiles = Tiles.init(cell_count_width, cell_count_height);
                console.log(sensors);
                for( var sensor of sensors){
                    
                    console.log(mapBounds.west, sensor.location.longitude);
                    let x_position =  parseInt((sensor.location.longitude - mapBounds.west) / cell_width)
                    let y_position =  parseInt((mapBounds.north - sensor.location.latitude ) / cell_width)

                    console.log("indexes" + x_position + "  " +  y_position);
                    console.log(x_position, y_position, sensor.sensordatavalues.P1, tiles);
                    tiles = Tiles.insertSensor(x_position, y_position, sensor.sensordatavalues.P1, tiles);
                };

                return tiles;

            },
            insertSensorsPurescript(sensors, mapBounds, cell_count_width) {
                // create sensor objects
                const ps_sensors = sensors.map((old) => Tiles.createCoordSensor(old.location.latitude, old.location.longitude, old.sensordatavalues.P1));

                //create matrix
                const ps_mapbounds = Tiles.createMapBounds(mapBounds.north, mapBounds.south, mapBounds.west, mapBounds.east);
                const ps_matrix = Tiles.initCoordMatrix(ps_mapbounds, cell_count_width);

                console.log(ps_matrix);

                //insert sensors
                const with_sensors = Tiles.insertManyCoordSensors(ps_sensors, ps_matrix);

                console.log(with_sensors);
                
            },




            initCustomControls(controlDiv, map){
                
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
                controlUI.title = 'Click to recenter the map';
                controlUI.click = controlUI;
                controlDiv.appendChild(controlUI);


                
                var controlText = document.createElement('div');
                controlText.style.color = 'rgb(25,25,25)';
                controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
                controlText.style.fontSize = '16px';
                controlText.style.lineHeight = '38px';
                controlText.style.paddingLeft = '5px';
                controlText.style.paddingRight = '5px';
                controlText.innerHTML = 'Center Map';
                controlUI.appendChild(controlText);

                // Setup the click event listeners: simply set the map to Chicago.
                controlUI.addEventListener('click', function() {
                    map.setCenter({ lat: 48.7758459, lng: 9.1829321 });
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
                            "color": this.getRandomColor(),
                        },
                        "geometry":{
                            "type":"Polygon",
                            "coordinates":[
                                [
                                    [cell.north, cell.west],
                                    [cell.south, cell.west],
                                    [cell.south, cell.east],
                                    [cell.north, cell.east],
                                    [cell.north, cell.west],

                                ]
                            ]
                        },
  
                    };
                    geojson.features.push(feature);
                });
                return geojson;
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