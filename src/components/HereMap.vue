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
                    center: { lng: this.lng, lat: this.lat },
                    pixelRatio: window.devicePixelRatio || 1

                }
            );
            this.map.addLayer(this.defaultLayers.vector.normal.traffic);
            var mapEvents = new H.mapevents.MapEvents(this.map);
            var behavior = new H.mapevents.Behavior(mapEvents);

            var ui = H.ui.UI.createDefault(this.map, this.defaultLayers, 'de-DE');

            // var weatherData = this.fetchData("https://weather.ls.hereapi.com/weather/1.0/report.json?product=observation&name=Stuttgart&apiKey=HRr7RNCsyzEchpHLkXO0MGpUOT1JUrSF54BIfHC2duY");
            // weatherData.then( data => {
            //     console.log(data);
            //     data.observations.location.forEach( location => {
            //         console.log(location);
            //         var marker = new H.map.Marker(
            //             {
            //                 lat: location.latitude,
            //                 lng: location.longitude
            //             }
            //         )
            //         this.map.addObject(marker);

            //     })
            // });
            var feinstaubData = this.fetchData("https://data.sensor.community/airrohr/v1/filter/area=48.7758459,9.1829321,10");
                feinstaubData.then(data => {
                    console.log(data);
                    data.forEach(sensor => {
                    var marker = new H.map.Marker(
                        {
                            lat: sensor.location.latitude,
                            lng: sensor.location.longitude,
                            alt: sensor.location.altitude
                        }
                    )
                    this.map.addObject(marker);
                    })
            })


        },

        methods: {

            async fetchData(url) {
                try {
                    var response = await fetch(url);
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