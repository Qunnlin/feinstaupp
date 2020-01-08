<template>
    <div class="leaflet">
        <div id="mapid" v-bind:style="{ width: width, height: height }"></div>
    </div>
</template>

<script>
    export default {
        name: "Leaflet",
        data: function () { 
            return {
                map: {},
            }
        },
        props: { 
            lat: String,
            lng: String,
            width: String,
            height: String
        },
        created: function () { 
        },
        mounted: function () { 
            his.map = L.map('mapid').setView([this.lat, this.lng], 13);

            var roads = L.gridLayer.googleMutant({
                type: 'roadmap'
            }).addTo(this.map);
            var feinstaubData = this.fetchJSON("https://data.sensor.community/airrohr/v1/filter/area=48.7758459,9.1829321,10");


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