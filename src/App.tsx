import { onMount, type Component } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';

let latitude: number = 0;
let longitude: number = 0;

const App: Component = () => {
  onMount(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        console.log("Latitude is :", position.coords.latitude);
        console.log("Longitude is :", position.coords.longitude);
        longitude = position.coords.longitude;
        latitude = position.coords.latitude;
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
