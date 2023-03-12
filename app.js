/* global maplibregl */ // Imported via <script> tag
import maplibre3DTilesLayer from './maplibre-3d-tiles-layer/maplibre-3d-tiles-layer';
import { floodLayer } from './flood/customLayer';
import './app.css';

const MAP_ID = 'buenos_aires';
const BASE_TILESET_URL = 'http://localhost:3002';
const BUENOS_AIRES_TILESET_URL = `${BASE_TILESET_URL}/MESH_2021/L15/LR/6359_6158_-001_lv15_0_transform.json`;
// const BUENOS_AIRES_TILESET_URL = `${BASE_TILESET_URL}/tileset_unified.json`;

// Load the maplibre map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-58.381507, -34.603344],
  zoom: 8.5,
  bearing: 0,
  pitch: 0,
  hash: true,
  maxZoom: 20,
});

map.on('style.load', function () {
  const buenosAires = new maplibre3DTilesLayer({
    id: MAP_ID,
    url: BUENOS_AIRES_TILESET_URL,
    color: 0xffffff,
    opacity: 1.0
  });
  map.addLayer(buenosAires);

  map.on('idle', function () {
    setTimeout(() => {
      map.triggerRepaint()
    }, 1000);
  });

  map.addLayer(floodLayer());

  const slider = document.getElementById("slider-input");

  slider.addEventListener("input", () => {
    console.log(slider.value);
    window.FLOOD = slider.value;
  });
});
