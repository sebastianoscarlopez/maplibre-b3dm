/* global mapboxgl */ // Imported via <script> tag
import Mapbox3DTilesLayer from './mapbox-3d-tiles-layer/mapbox-3d-tiles-layer';

// TODO - Add your mapbox token here
mapboxgl.accessToken =
  'pk.eyJ1Ijoic2ViYXN0aWFub3NjYXJsb3BleiIsImEiOiJjbDA1ZW5ueDkxbmszM2RucHdueW02MXViIn0.7WjEaDjCoKzpbaB3rZ_RAg'; //process.env.MapboxAccessToken; // eslint-disable-line

const BASE_TILESET_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
const ROTTERDAM_TILESET_URL = `${BASE_TILESET_URL}/3d-tiles/geodan/rotterdam/tileset.json`;
const AHN_TILESET_URL = `${BASE_TILESET_URL}/3d-tiles/geodan/ahn/tileset.json`;

// Load the mapbox map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10?optimize=true',
  center: [-58.4, -34.6],
  zoom: 11.5,
  bearing: -135,
  pitch: 60,
  hash: true
});

map.on('style.load', function () {
  const rotterdam = new Mapbox3DTilesLayer({
    id: 'rotterdam',
    url: 'http://localhost:3002/tileset.json', //ROTTERDAM_TILESET_URL,
    color: 0xffffff,
    opacity: 0.9
  });
  map.addLayer(rotterdam, 'waterway-label');

  // const ahn = new Mapbox3DTilesLayer({
  //   id: 'ahn',
  //   url: 'http://localhost:3000/tileset.json',//AHN_TILESET_URL,
  //   color: 0x007722,
  //   opacity: 1.0,
  //   pointsize: 1.0
  // });
  // map.addLayer(ahn, 'rotterdam');
});

/*
const THREE = temp1.THREE
const axisX = new THREE.Vector3( 1, 0, 0 );
const axisY = new THREE.Vector3( 0, 1, 0 );
const axisZ = new THREE.Vector3( 0, 0, 1 );
let m = new THREE.Matrix4()

m.makeRotationAxis(axisZ, 1.0193)
*/
