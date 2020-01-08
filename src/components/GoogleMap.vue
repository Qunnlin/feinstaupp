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
                // default to Montreal to keep it simple
                // change this to whatever makes sense
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

                var myMapType = new google.maps.ImageMapType({
                    getTileUrl: function(coord, zoom) {
                        return "https://tile.openweathermap.org/map/clouds_new/5/48.7758459/9.1829321.png?appid=9ed58223d2e011bd45529508e9b9d8b6";
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
            
        }
    }
</script>

<style scoped></style>