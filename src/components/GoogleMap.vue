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
                    north: 48.805000229,
                    south: 48.755,
                    west: 9.14,
                    east: 9.230019239

                };
 

                // set Map Options and Zoom
                // map.setOptions({
                //     minZoom: 10,
                //     restriction: {
                //         latLngBounds: mapBounds
                //     }
                // });
                var test = this.getGrid2(mapBounds, 200);
                test.forEach(cell => {
                    var rectangle = new google.maps.Rectangle({
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: '#FF0000',
                        fillOpacity: 0,
                        map: map,
                        bounds: {
                            north: cell.north,
                            south: cell.south,
                            east: cell.east,
                            west: cell.west
                        }
                    });
                })

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



                // // fetch current (<5 min) air data
                // var currentSensorData = this.fetchJSON("https://data.sensor.community/airrohr/v1/filter/box="+ mapBounds.north + "," + mapBounds.east + "," + mapBounds.south + "," + mapBounds.west);
                // currentSensorData.then(data => {

                //     // sort air data after value_types (temperature, pressure, P1/P2 pollution)
                //     //var sensorIds = this.extractSensorIds(data);
                //     var sortedData = this.sortSensorData(data);

                //     console.log(sortedData);
                //     sortedData["P1"].forEach(sensor => {

                //         // create marker for each sensor
                //         let marker = new google.maps.Marker({
                //             position:{lat: parseFloat(sensor.location.latitude), lng: parseFloat(sensor.location.longitude)},
                //             map: map,
                //             title: sensor.name
                //         });

                //         // create pop up window
                //         let sensorInformation = '<div id=sensorBox>'+
                //             '<h3>'+ sensor.sensor.sensor_type.manufacturer + ", " + sensor.sensor.sensor_type.name +'</h3>' +
                //             // '<p>Temperatur: ' + sensor.main.temp + ' C°</p>' +
                //             // '<p>Gefühlt: ' + sensor.main.feels_like + ' C°</p>' +
                //             // '<p>Lufdruck: ' + sensor.main.pressure + ' hPa</p>' +
                //             // '<p>Luftfeuchtigkeit: ' + sensor.main.humidity + '%</p>' +
                //             // '<b>Windgeschwindigkeit: ' + sensor.wind.speed + ' km/h</b>' +
                //             '</div>';

                //         let infoWindow = new google.maps.InfoWindow({ 
                //             content: sensorInformation});

                //         // add functionality
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

                //     });
  
                // });
                
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
                    sensor.sensordatavalues.forEach(sensordatavalue => {
                        if(sortedData[sensordatavalue.value_type]){
                            sortedData[sensordatavalue.value_type].push(sensor);
                        } else {
                            sortedData[sensordatavalue.value_type] = []
                            sortedData[sensordatavalue.value_type].push(sensor);
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

            // generate grid over map with fixed cell size (not working correctly)
            getGrid2(mapBounds, cell_count_width){
                let nw = {lat: mapBounds.north, lng: mapBounds.west};
                let ne = {lat: mapBounds.north, lng: mapBounds.east};
                let sw = {lat: mapBounds.south, lng: mapBounds.west};
                // let se = {lat: mapBounds.south, lng: mapBounds.east};
                
                var grid =[];

                console.log("" + ne.lng + "-"  + nw.lng + "=" + (ne.lng - nw.lng))
                // let cell_width = this.meterLength(nw, ne) / cell_count_width;
                let cell_width = (ne.lng - nw.lng) / cell_count_width;

                console.log(cell_width);
                // let cell_count_height = parseInt(this.meterLength(nw, sw) / cell_width);
                let cell_count_height = parseInt( Math.abs(nw.lat - sw.lat) / cell_width);

                //let cell_height = Math.abs(nw - sw) / cell_count_height;
                

                for(var i = 0; i<= cell_count_width; i+= 1){
                    for(var j = 0; j<=cell_count_height; j+=1){
                        let cellBounds = {
                            north: mapBounds.north - j*cell_width,
                            south: mapBounds.north - (j+1)*cell_width,
                            west: mapBounds.west + i*cell_width,
                            east: mapBounds.west + (i+1)*cell_width
                        }
                        // console.log(this.meterLength({lat: cellBounds.north, lng: cellBounds.west}, {lat: cellBounds.south, lng: cellBounds.east}));
                        grid.push(cellBounds);
                    }
                    // console.log("cell column: " + i);
                    
                    // console.log("from " + (mapBounds.west + this.metersToDeg(i*cell_width)) + " to " + (mapBounds.west + this.metersToDeg((i+1)*cell_width)));


                }
                return grid;
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
            
        }
    }
</script>

<style scoped></style>