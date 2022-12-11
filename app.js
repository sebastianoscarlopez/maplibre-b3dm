/* global maplibregl */ // Imported via <script> tag
import maplibre3DTilesLayer from './maplibre-3d-tiles-layer/maplibre-3d-tiles-layer';

const BASE_TILESET_URL = 'http://localhost:3002';
// const BUENOS_AIRES_TILESET_URL = `${BASE_TILESET_URL}/MESH_2021/L15/LR/6359_6158_-001_lv15_0_transform.json`;
const BUENOS_AIRES_TILESET_URL = `${BASE_TILESET_URL}/tileset_unified.json`;

// Load the maplibre map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-58.381507, -34.603344],
  zoom: 8.5,
  bearing: 0,
  pitch: 0,
  hash: true

});

map.on('style.load', function () {
  const buenosAires = new maplibre3DTilesLayer({
    id: 'buenos_aires',
    url: BUENOS_AIRES_TILESET_URL,
    color: 0xffffff,
    opacity: 1.0
  });
  map.addLayer(buenosAires);

});
