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
                let mapBounds = {
                    north: 48.805000229,
                    south: 48.755,
                    west: 9.14,
                    east: 9.230019239

                };

                map.setOptions({
                    minZoom: 10,
                    restriction: {
                        latLngBounds: mapBounds
                    }
                });

                let trafficLayer = new google.maps.TrafficLayer;
                trafficLayer.setMap(map);
                let weatherData = this.fetchJSON("http://api.openweathermap.org/data/2.5/find?lat=48.7758459&lon=9.1829321&cnt=15&units=metric&appid=9ed58223d2e011bd45529508e9b9d8b6");
                weatherData.then( data => {
                    for(var sensor of data.list){
                        let weatherConditionInfo = 
                            '<div id=weatherBox>'+
                            '<h3>'+sensor.name+'</h3>' +
                            '<p>Temperatur: ' + sensor.main.temp + ' C°</p>' +
                            '<p>Gefühlt: ' + sensor.main.feels_like + ' C°</p>' +
                            '<p>Lufdruck: ' + sensor.main.pressure + ' hPa</p>' +
                            '<p>Luftfeuchtigkeit: ' + sensor.main.humidity + '%</p>' +
                            '<b>Windgeschwindigkeit: ' + sensor.wind.speed + ' km/h</b>' +
                            '</div>';
                        let infoWindow = new google.maps.InfoWindow({ 
                            content: weatherConditionInfo});

                        let windArrow = {
                            path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                            strokeColor: '#141414'
                        };

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

                        let marker = new google.maps.Marker({
                            position: {lat: sensor.coord.lat, lng: sensor.coord.lon} ,
                            icon: "http://openweathermap.org/img/w/" + sensor.weather[0].icon + ".png",
                            map: map,
                            title: sensor.name
                        });
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


                var currentSensorData = this.fetchJSON("https://data.sensor.community/airrohr/v1/filter/area=48.7758459,9.1829321,10");
                currentSensorData.then(data => {
                    console.log(data);
                    // var markers = data.map(function(sensor){
                    //     return new google.maps.Marker({
                    //         position: {lat: parseInt(sensor.location.latitude), lng: parseInt(sensor.location.longitude)},
                    //         label: sensor.name,
                    //     });
                    // })
                    data.forEach(sensor => {
                        console.log(parseFloat(sensor.location.latitude), parseFloat(sensor.location.longitude));
                        let marker = new google.maps.Marker({
                            position:{lat: parseFloat(sensor.location.latitude), lng: parseFloat(sensor.location.longitude)},
                            map: map,
                            title: sensor.name
                        });
                        console.log(marker.position);

                    });
  
                });

                var myMapType = new google.maps.ImageMapType({
                    getTileUrl: function(coord, zoom) {
                        return "https://tile.openweathermap.org/map/pressure_new/"+ zoom + "/" + coord.x + "/"+ coord.y + ".png?appid=c6a3ae840aa6d20d4b2bb8985779af1e";
                    },
                    tileSize: new google.maps.Size(256, 256),
                    maxZoom: 9,
                    minZoom: 0,
                    name: 'mymaptype'
                });

                //map.overlayMapTypes.insertAt(0, myMapType);

                






                
            }); 



        },

        methods: {

            async fetchJSON(url) {
                try {
                    var response = await fetch(url);
                    return response.json();
                } catch(err) {
                    alert(err);
                }
            },

            async fetchData(url) {
                try {
                    var response = await fetch(url);
                    console.log(response);
                    return response;
                } catch(err) {
                    alert(err);
                }
            },

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

            getGrid(mapBounds, cellSize){
                let sw = {lat: mapBounds.south, lng: mapBounds.west};
                let se = {lat: mapBounds.south, lng: mapBounds.east};
                let nw = {lat: mapBounds.north, lng: mapBounds.west};
                let ne = {lat: mapBounds.north, lng: mapBounds.east};
                var grid =[];
                for(var i = 0; i<= this.meterLength(nw, ne); i+=cellSize){
                    for(var j = 0; j<=this.meterLength(ne, sw); j+=cellSize){
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

            calcLengthFactor(windspeed){
                let maxFactor = 0.02;
                let minSpeed = 0;
                let maxSpeed = 15;
                let normSpeed = (windspeed - minSpeed)/(maxSpeed-minSpeed);

                return maxFactor*normSpeed;

            },

            animateWindLine(line, factor) {
                var count = 0;
                window.setInterval(function() {
                    count = (count + 1) % 200;

                    var icons = line.get('icons');
                    icons[0].offset = (count / 2) + '%';
                    line.set('icons', icons);
                }, 200*factor);
            },

            saveWeatherData(data){
                    var fs = require('browserify-fs');
                    let filename = "/public/weather_data/weather_"+Date.now()+".json";
                    console.log(filename);
                    fs.writeFile(filename, data, function(err) {
                        if (err) {
                            console.log(err);
                        }
                    });
            },
            
        }
    }
</script>

<style scoped></style>