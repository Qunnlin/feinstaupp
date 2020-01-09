<template>
    <div class="google-map">
        <gmap-map ref="mapRef"
        :center="center"
        :zoom="12"
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
                let trafficLayer = new google.maps.TrafficLayer;
                trafficLayer.setMap(map);


                let weatherData = this.fetchJSON("http://api.openweathermap.org/data/2.5/find?lat=48.7758459&lon=9.1829321&cnt=15&appid=9ed58223d2e011bd45529508e9b9d8b6");
                weatherData.then( data => {
                    for(var sensor of data.list){
                        var marker = new google.maps.Marker({
                            position: {lat: sensor.coord.lat, lng: sensor.coord.lon} ,
                            map: map,
                            title: sensor.name
                        });
                    }
                });


                var currentSensorData = this.fetchJSON("https://data.sensor.community/airrohr/v1/filter/area=48.7758459,9.1829321,10");
                currentSensorData.then(data => {
                    var heatMapData = [];
                    data.forEach(sensor => {
                        // console.log("{+lat:"+ parseInt(sensor.location.latitude) + ", lng:" + parseInt(sensor.location.longitude)+"}");
                        let dataPoint = {};
                        dataPoint.location = new google.maps.LatLng(parseFloat(sensor.location.latitude), parseFloat(sensor.location.longitude));
                        dataPoint.weight = Math.random();
                        heatMapData.push(dataPoint);

                    });
                    var heatmap = new google.maps.visualization.HeatmapLayer({
                        data: heatMapData
                    });
                    heatmap.set("radius", heatmap.get("radius") ? null : 40);
                    heatmap.setMap(map);    
                });

                // var myMapType = new google.maps.ImageMapType({
                //     getTileUrl: function(coord, zoom) {
                //         return "https://tile.openweathermap.org/map/clouds_new/5/48.7758459/9.1829321.png?appid=c6a3ae840aa6d20d4b2bb8985779af1e";
                //     },
                //     tileSize: new google.maps.Size(256, 256),
                //     maxZoom: 9,
                //     minZoom: 0,
                //     name: 'mymaptype'
                // });

                // map.overlayMapTypes.insertAt(0, myMapType);


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
            
        }
    }
</script>

<style scoped></style>