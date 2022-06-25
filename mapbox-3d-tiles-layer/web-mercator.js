import * as THREE from 'three';
const WEBMERCATOR_EXTENT = 20037508.3427892;

export function transform2mapbox(matrix) {
  const min = -WEBMERCATOR_EXTENT;
  const max = WEBMERCATOR_EXTENT;
  const scale = 1 / (2 * WEBMERCATOR_EXTENT);

  const result = matrix.slice(); // copy array
  result[12] = (matrix[12] - min) * scale; // x translation
  result[13] = (matrix[13] - max) * -scale; // y translation
  result[14] = matrix[14] * scale; // z translation
  /*
  result[0] *= 10;
  result[1] *= 10;
  result[2] *= 10;

  result[4] *= 10;
  result[5] *= 10;
  result[6] *= 10;

  result[8] *= 10;
  result[9] *= 10;
  result[10] *= 10;
*/
  return new THREE.Matrix4().fromArray(result).scale(new THREE.Vector3(scale, -scale, scale));
}

/*
function webmercator2mapbox(x, y, z) {
  const min = -WEBMERCATOR_EXTENT;
  const max = WEBMERCATOR_EXTENT;
  const range = 2 * WEBMERCATOR_EXTENT;
  return [(x - min) / range, ((y - max) / range) * -1, z / range];
}
*/
