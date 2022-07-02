/* global maplibregl */ // Imported via <script> tag
import maplibre3DTilesLayer from './maplibre-3d-tiles-layer/maplibre-3d-tiles-layer';

const BASE_TILESET_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
const ROTTERDAM_TILESET_URL = `${BASE_TILESET_URL}/3d-tiles/geodan/rotterdam/tileset.json`;
const AHN_TILESET_URL = `${BASE_TILESET_URL}/3d-tiles/geodan/ahn/tileset.json`;
const THERMO = `http://192.168.0.61:3002/tileset.json`;

// Load the maplibre map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
  // center: [-58.4, -34.6], // Rotterdam
  center: [-58.381507, -34.603344], // Buenos Aires
  zoom: 18,
  bearing: -135,
  pitch: 60,
  hash: true
});

map.on('style.load', function () {
  const layer3dtile = new maplibre3DTilesLayer({
    id: '3dtile',
    url: THERMO,
    color: 0xBBFFBB,
    opacity: 0.9
  });
  map.addLayer(layer3dtile);

  // const ahn = new maplibre3DTilesLayer({
  //   id: 'ahn',
  //   url: 'http://localhost:3000/tileset.json',//AHN_TILESET_URL,
  //   color: 0x007722,
  //   opacity: 1.0,
  //   pointsize: 1.0
  // });
  // map.addLayer(ahn);
});

/*
const THREE = temp1.THREE
const axisX = new THREE.Vector3( 1, 0, 0 );
const axisY = new THREE.Vector3( 0, 1, 0 );
const axisZ = new THREE.Vector3( 0, 0, 1 );
let m = new THREE.Matrix4()

m.makeRotationAxis(axisZ, 1.0193)
*/
