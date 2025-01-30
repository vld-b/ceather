import { onMount, type Component } from "solid-js";
import { fetchWeatherApi } from "openmeteo";

import logo from "./logo.svg";
import styles from "./App.module.css";

let latitude: number = 0;
let longitude: number = 0;

let params = {};
const url = "https://api.open-meteo.com/v1/forecast";
let weatherData: {
  hourly: {
    time: Date[];
    temperature_2m: Float32Array;
  }
} = {
  hourly: {
    time: [],
    temperature_2m: new Float32Array(),
  },
};

const App: Component = () => {
  onMount(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        console.log("Latitude is :", position.coords.latitude);
        console.log("Longitude is :", position.coords.longitude);
        longitude = position.coords.longitude;
        latitude = position.coords.latitude;
        params = {
          longitude: longitude,
          latitude: latitude,
          hourly: "temperature_2m",
        };
        const responses = await fetchWeatherApi(url, params);

        // Helper function to form time ranges
        const range = (start: number, stop: number, step: number) => 
          Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

        // only the first response is needed
        const response = responses[0];

        // Attributes for timezone and location
        const utcOffsetSeconds = response.utcOffsetSeconds();
        const timezone = response.timezone();
        const timezoneAbbreviation = response.timezoneAbbreviation();
        const hourly = response.hourly()!;

        weatherData = {
          hourly: {
            time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
              (t) => new Date((t+utcOffsetSeconds)*1000)
            ),
            temperature_2m: hourly.variables(0)!.valuesArray()!,
          },
        }; 

        for (let i = 0; i < weatherData.hourly.time.length; i++) {
          console.log(weatherData.hourly.time[i].toISOString() + ": " + weatherData.hourly.temperature_2m[i]);
        }
      });
    } else {
      console.log("Geolocation is not available");
    }
  });

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          class={styles.link}
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid
        </a>
      </header>
    </div>
  );
};

export default App;
