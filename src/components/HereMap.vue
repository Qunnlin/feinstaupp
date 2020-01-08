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

            // var weatherData = this.fetchJSON("https://weather.ls.hereapi.com/weather/1.0/report.json?product=observation&name=Stuttgart&apiKey=HRr7RNCsyzEchpHLkXO0MGpUOT1JUrSF54BIfHC2duY");
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
            // this.overlayWeather(this.map, "temp_new", this.lat, this.lng);

            var tempData = this.fetchData("https://tile.openweathermap.org/map/temp_new/"+this.lat+"/"+this.lng+"/13.png?appid=9ed58223d2e011bd45529508e9b9d8b6");
            var feinstaubData = this.fetchJSON("https://data.sensor.community/airrohr/v1/filter/area=48.7758459,9.1829321,10");
            feinstaubData.then(data => {
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
            overlayWeather(map, layer, lat, lng) {
                // Create a tile provider from our images of historical Berlin
                var tileProvider = new H.map.provider.ImageTileProvider({
                    // We have tiles only for zoom levels 12â€“15,
                    // so on all other zoom levels only base map will be visible
                    zoom: 15,
                    opacity: 1,
                    getURL: function (column, row, zoom) {
                        // If Berlin is not displayed, return a blank tile.
                     return "https://tile.openweathermap.org/map/"+layer+"/"+lat+"/"+lng+"/"+zoom+".png?appid=9ed58223d2e011bd45529508e9b9d8b6";

                    }
                });

                tileProvider.getCopyrights = function (bounds, level) {
                    // We should return an array of objects that implement H.map.ICopyright interface
                    return [{
                    label: "Overlay derived from OpenWeatherMaps",
                    alt: 'Overlay Based on OpenWeatherMaps'
                    }];
                };
                // Now let's create a layer that will consume tiles from our provider
                var overlayLayer = new H.map.layer.TileLayer(tileProvider, {
                    // Let's make it semi-transparent
                    opacity: 0.5
                });

                map.addLayer(overlayLayer);

            }
            
        }
    }
</script>

<style scoped></style>