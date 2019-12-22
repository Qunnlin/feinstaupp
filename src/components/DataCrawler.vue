<template>
  <div class="data-crawler">
    <div v-if="loading" class="loading">
      Loading...
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="post" class="content">
      <h2>{{ post.title }}</h2>
      <p>{{ post.body }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      loading: false,
      post: null,
      error: null
    }
  },
  created () {
    // fetch the data when the view is created and the data is
    // already being observed
    this.fetchWeatherData()
  },
  methods: {
    fetchWeatherData () {
      this.error = this.post = null
      this.loading = true

      fetch("https://weather.ls.hereapi.com/weather/1.0/report.json?product=observation&name=Stuttgart&apiKey=HRr7RNCsyzEchpHLkXO0MGpUOT1JUrSF54BIfHC2duY")
        .then(response => response.json())
        .then( weatherData => {
            this.loading = false;
            //console.log(weatherData);
            this.post = weatherData;
        })
    }
  }
}
</script>
