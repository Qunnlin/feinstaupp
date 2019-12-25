<template>
    <div id="app">
        <HereMap
            apiKey="HRr7RNCsyzEchpHLkXO0MGpUOT1JUrSF54BIfHC2duY"
            lat="48.7758459"
            lng="9.1829321"
            width="100%"
            height="900px" />
    </div>
</template>

<script>
    import HereMap from "./components/HereMap.vue"
    export default {
        name: 'app',
        components: {
            HereMap
        }
    }
</script>

<style>
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
    }
</style>