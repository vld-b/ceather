import "./App.css";

import { createSignal, onMount, Show, type Component, type Signal } from "solid-js";
import { fetchWeatherApi } from "openmeteo";
import { getTimes } from "suncalc";

let latitude: number = 0;
let longitude: number = 0;

let [currentTime, setCurrentTime]: Signal<Date> = createSignal<Date>(new Date(Date.now()));
let [sunUp, setSunUp]: Signal<boolean> = createSignal<boolean>(false);
let [gotData, setGotData]: Signal<boolean> = createSignal<boolean>(false);

let params = {};
const url = "https://api.open-meteo.com/v1/forecast";
let [weatherData, setWeatherData]: Signal<{
  hourly: {
    time: Date[];
    temperature_2m: Float32Array;
  }
}> = createSignal<{
  hourly: {
    time: Date[];
    temperature_2m: Float32Array;
  }
}>({
  hourly: {
    time: [],
    temperature_2m: new Float32Array(),
  },
});

function formatTime(num: number) {
  if (num.toString().length === 1) {
    return ("0" + num.toString()).toString();
  } else {
    return num.toString();
  }
}

const Loading: Component = () => {
  return (
    <div class="loadingCube"></div>
  );
}

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
        const hourly = response.hourly()!;

        setWeatherData({
          hourly: {
            time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
              (t) => new Date((t+utcOffsetSeconds)*1000)
            ),
            temperature_2m: hourly.variables(0)!.valuesArray()!.map((t) => Number(t.toString().slice(0, 2))),
          },
        }); 

        for (let i = 0; i < weatherData().hourly.time.length; i++) {
          console.log(weatherData().hourly.time[i].toISOString() + ": " + weatherData().hourly.temperature_2m[i]);
        }
        
        const forecastEl = document.querySelector(".forecast");
        if (forecastEl) {
          for (let i = 0; i < 48; ++i) {
            const element = document.createElement('div');
            element.className = 'forecastTile';
            element.innerHTML = `
              <h3 class="forecastData">${formatTime(weatherData().hourly.time[i+currentTime().getHours()].getHours())}:00</h3>
              <h3 class="forecastData">${weatherData().hourly.temperature_2m[i+currentTime().getHours()]}°C</h3>
            `;
            forecastEl.appendChild(element);
          }
        }

        setGotData(true);
      });      console.log("Geolocation is not available");
    }
    // Calculate whether the sun is up or down
    const times = getTimes(new Date(), latitude, longitude);
    setSunUp(times.sunrise.getTime() < currentTime().getTime() && times.sunset.getTime() > currentTime().getTime());
    let appComponent: HTMLElement =  document.querySelector(".App")!;
    if (sunUp()) {
      appComponent.style.background = "rgb(0, 114, 255)";
      appComponent.style.background = "linear-gradient(0deg, rgba(0,114,255,1) 0%, rgba(67,166,220,1) 100%)";
    } else {
      appComponent.style.background = "rgb(9, 9, 121)";
      appComponent.style.background = "linear-gradient(0deg, rgba(9,9,121,1) 0%, rgba(0,114,255,1) 100%)";
    }
    appComponent.style.width = document.body.clientWidth + "px";

    document.onresize = () => {
      appComponent.style.margin = "0 calc(100dvw - 100%) 0 0";
    };
  });

  return (
      <div class="App">
        <div class="welcomeContainer">
          <h1>At the moment it is</h1>
          <h1 class="currentTime">{formatTime(currentTime().getHours())}:{formatTime(currentTime().getMinutes())}</h1>
          <h1>
            <Show when={!gotData()} fallback={weatherData().hourly.temperature_2m[currentTime().getHours()]}>
              <Loading/>
            </Show>
          °C</h1>
        </div>
        <div class="forecast"></div>
      </div>
  );
};

export default App;