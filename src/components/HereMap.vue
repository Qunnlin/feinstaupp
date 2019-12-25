<template>
    <div class="here-map">
        <div ref="map" v-bind:style="{ width: width, height: height }"></div>
    </div>
</template>

<script>
    export default {
        name: "HereMap",
        data: function () { 
            return {
                map: {},
                platform: {},
                defaultLayers: {},
            }
        },
        props: { 
            apiKey: String,
            lat: String,
            lng: String,
            width: String,
            height: String
        },
        created: function () { 
            this.platform = new H.service.Platform({
                "apikey": this.apiKey
            });
            this.defaultLayers = this.platform.createDefaultLayers();

        },
        mounted: function () { 
            this.map = new H.Map(
                this.$refs.map,
                this.defaultLayers.vector.normal.map,
                {
                    zoom: 13,
                    center: { lng: this.lng, lat: this.lat }
                }
            );
            this.map.addLayer(this.defaultLayers.vector.normal.traffic);
            var ui = H.ui.UI.createDefault(this.map, this.defaultLayers);
            var mapEvents = new H.mapevents.MapEvents(this.map);
            var behavior = new H.mapevents.Behavior(mapEvents);
            var weatherData = this.fetchWeatherData(); 
            weatherData.then()

        },

        methods: {
            async fetchWeatherData () {
                try {
                    var response = await fetch("https://weather.ls.hereapi.com/weather/1.0/report.json?product=observation&name=Stuttgart&apiKey=HRr7RNCsyzEchpHLkXO0MGpUOT1JUrSF54BIfHC2duY", {credentials: 'cross-origin'});
                    response = response.json();
                    return response;
                } catch(err) {
                    alert(err);
                }

            }
        }
    }
</script>

<style scoped></style>