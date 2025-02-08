import { type Component } from "solid-js";

export const Loading: Component = () => {
  return (
    <div class="loadingCube"></div>
  );
}

export const WeatherModule: Component = (props) => {
  return(
    <h3 class="forecastData">
      {props.children}
    </h3>
  );
}
