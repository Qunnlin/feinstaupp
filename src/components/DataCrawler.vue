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
const fs = require('fs');
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
    },
                
    async downloadArchive(lastMonth, sensor){
        lastMonth.forEach(date => {
            let month = ("0" + (date.getMonth() + 1)).slice(-2)
            let dateString =  date.getFullYear() + "-" + month + "-" + date.getDate();
            let filename = dateString+ "_" + sensor.sensor.sensor_type.name.toLowerCase() + "_" + sensor.id ;
            let filepath = "../../data/dust/" + dateString + "/";

            // if(!fs.existsSync(filepath)) {
                // fs.mkdirSync(filepath)
            // };
            
            // if(!fs.existsSync(filepath + filename)){
                console.log(filename);
                let data = this.fetchData('http://archive.luftdaten.info/' + dateString + '/' + filename + '.csv');
                console.log(data);
            // }

        })
    },

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

    // get timestamps of last 30 days
    getLastMonth(){
      var date = new Date();
      var lastMonth = [];
      for(let i = 0; i < 30; i++){
          date = new Date(new Date().setDate(date.getDate()-1));
          lastMonth.push(date);
      }
      return lastMonth;
    },

    // get hourly timestamps for last 24 hours
    getlast24H(){
        let lastDay =[];
        var date = new Date();
        let miliHour = 60*60*1000;
        var currentTime = date.getTime();
        let lastFullHour =  date.getTime() - date.getMinutes()*60*1000 - date.getSeconds()*1000 - date.getMilliseconds()

        lastDay.push(new Date(currentTime));
        lastDay.push(new Date(lastFullHour));

        for(let i = 1; i < 24; i++){

            lastDay.push(new Date(lastFullHour-(miliHour*i)));
        }
        return lastDay;
    },
  }
}
</script>
