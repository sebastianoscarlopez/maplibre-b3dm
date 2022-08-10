/* global maplibregl */ // Imported via <script> tag
import maplibre3DTilesLayer from './maplibre-3d-tiles-layer/maplibre-3d-tiles-layer';

const BASE_TILESET_URL = 'http://localhost:3002';
//const BASE_TILESET_URL = 'https://fc04-152-170-90-160.sa.ngrok.io'
const BUENOS_AIRES_TILESET_URL = `${BASE_TILESET_URL}/L15/LR/6359_6158_-001_lv15_0_transform.json`;
const ROTTERDAM_TILESET_URL = `${BASE_TILESET_URL}/3d-tiles/geodan/rotterdam/tileset.json`;
const AHN_TILESET_URL = `${BASE_TILESET_URL}/3d-tiles/geodan/ahn/tileset.json`;
const THERMO = `http://192.168.0.61:3002/tileset.json`;

// Load the mapbox map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  // center: [-58.4, -34.6], // Rotterdam
  center: [-58.381507, -34.603344], // Buenos Aires
  zoom: 18,
  bearing: 0,
  pitch: 0,
  hash: true
});

map.on('style.load', function () {
  const layer3dtile = new maplibre3DTilesLayer({
    id: 'buenos_aires',
    url: BUENOS_AIRES_TILESET_URL,
    color: 0xffffff,
    opacity: 1.0
  });
  map.addLayer(layer3dtile);

  // const box = new THREE.Box3();

  // const mesh = new THREE.Mesh(
  //   new THREE.SphereGeometry(),
  //   new THREE.MeshBasicMaterial()
  // );

  // // ensure the bounding box is computed for its geometry
  // // this should be done only once (assuming static geometries)
  // mesh.geometry.computeBoundingBox();

  // // ...

  // // in the animation loop, compute the current bounding box with the world matrix
  // box.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);

});
