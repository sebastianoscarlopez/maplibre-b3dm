/* global mapboxgl */ // Imported via <script> tag
import Mapbox3DTilesLayer from './mapbox-3d-tiles-layer/mapbox-3d-tiles-layer';

// TODO - Add your mapbox token here
mapboxgl.accessToken =
  'pk.eyJ1Ijoic2ViYXN0aWFub3NjYXJsb3BleiIsImEiOiJjbDA1ZW5ueDkxbmszM2RucHdueW02MXViIn0.7WjEaDjCoKzpbaB3rZ_RAg'; //process.env.MapboxAccessToken; // eslint-disable-line

//const BASE_TILESET_URL = 'http://localhost:3002';
//const BUENOS_AIRES_TILESET_URL = `${BASE_TILESET_URL}/tileset.json`;
const BASE_TILESET_URL = 'http://localhost:3002';
const BUENOS_AIRES_TILESET_URL = `${BASE_TILESET_URL}/MESH_2021/L15/LR/6359_6158_-001_lv15_0_transform.json`;

// Load the mapbox map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10?optimize=true',
  center: [-58.381507, -34.603344],
  zoom: 8.5,
  bearing: 0,
  pitch: 0,
  hash: true

});

map.on('style.load', function () {
  const buenosAires = new Mapbox3DTilesLayer({
    id: 'buenos_aires',
    url: BUENOS_AIRES_TILESET_URL,
    color: 0xffffff,
    opacity: 1.0
  });
  map.addLayer(buenosAires, 'waterway-label');

});
