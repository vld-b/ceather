import "./App.css";

import { createSignal, onMount, Show, type Component, type Signal } from "solid-js";
import { render } from "solid-js/web";
import { fetchWeatherApi } from "openmeteo";
import { getTimes } from "suncalc";

import { WeatherModule, Loading } from "./Components";
import { formatTime } from "./utils";

let latitude: number = 0;
let longitude: number = 0;

const [currentTime, setCurrentTime]: Signal<Date> = createSignal<Date>(new Date(Date.now()));
const [sunUp, setSunUp]: Signal<boolean> = createSignal<boolean>(false);
const [gotData, setGotData]: Signal<boolean> = createSignal<boolean>(false);

let params = {};
const url = "https://api.open-meteo.com/v1/forecast";
let [weatherData, setWeatherData]: Signal<{
  hourly: {
    time: Date[],
    temperature_2m: Float32Array,
    cloud: Float32Array,
  },
  current: {
    rel_humidity_2m: number,
    wind_speed: number,
    wind_direction: number,
  }
}> = createSignal<{
  hourly: {
    time: Date[],
    temperature_2m: Float32Array,
    cloud: Float32Array,
  },
  current: {
    rel_humidity_2m: number,
    wind_speed: number,
    wind_direction: number,
  }
}>({
  hourly: {
    time: [],
    temperature_2m: new Float32Array(),
    cloud: new Float32Array(),
  },
  current: {
    rel_humidity_2m: 0,
    wind_speed: 0,
    wind_direction: 0,
  }
});

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
          hourly: ["temperature_2m", "cloud_cover"],
          current: ["relative_humidity_2m", "wind_speed_10m", "wind_direction_10m"],
        };
        const responses = await fetchWeatherApi(url, params);

        // Helper function to form time ranges (from the API docs)
        const range = (start: number, stop: number, step: number) => 
          Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

        // only the first response is needed
        const response = responses[0];

        // Attributes for timezone and location (from the API docs)
        const utcOffsetSeconds = response.utcOffsetSeconds();
        const hourly = response.hourly()!;
        const current = response.current()!;

        setWeatherData({
          hourly: {
            time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
              (t) => new Date((t+utcOffsetSeconds)*1000)
            ),
            temperature_2m: hourly.variables(0)!.valuesArray()!.map((t) => Number(t.toString().slice(0, 2))),
            cloud: hourly.variables(1)!.valuesArray()!,
          },
          current: {
            rel_humidity_2m: Number(current.variables(0)!.value()),
            wind_speed: Number(current.variables(1)!.value()),
            wind_direction: Number(current.variables(2)!.value()),
          }
        }); 

        for (let i = 0; i < weatherData().hourly.time.length; i++) {
          console.log(weatherData().hourly.time[i].toISOString() + ": " + weatherData().hourly.temperature_2m[i] + " ; " + weatherData().hourly.cloud[i]);
        }
        
        const forecastEl = document.querySelector(".forecast");
        if (forecastEl) {
          for (let i = 0; i < 48; ++i) {
            let cloudy = weatherData().hourly.cloud[i+currentTime().getHours()];
            const element = <div class="forecastTile">
            <WeatherModule>
              <Show when={gotData()} fallback={<Loading/>}>
              {formatTime(weatherData().hourly.time[i+currentTime().getHours()].getHours())}:00
              </Show>
            </WeatherModule>
            <WeatherModule>{weatherData().hourly.temperature_2m[i+currentTime().getHours()]}°C</WeatherModule>
            <WeatherModule>{cloudy}%
              <Show when={cloudy < 33}>
                <i class="fa-solid fa-sun"></i>
              </Show>
              <Show when={67 > cloudy && cloudy >= 33}>
                <i class="fa-solid fa-cloud-sun"></i>
              </Show>
              <Show when={cloudy >= 67}>
              <i class="fa-solid fa-cloud"></i>
              </Show>
            </WeatherModule>
          </div>;
            render(() => element, forecastEl);
          }
        }

        setGotData(true);
      });
    } else {
      console.log("Geolocation is not available");
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
    
    document.onresize = () => {
      appComponent.style.width = document.body.clientWidth + "px";
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
        <div class="relhumidity">
          <h1>Relative humidity:</h1>
          <h1>{weatherData().current.rel_humidity_2m}%</h1>
        </div>
      </div>
  );
};

export default App;