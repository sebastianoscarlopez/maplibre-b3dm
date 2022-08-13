import * as THREE from 'three';
import { Tileset3D } from '@loaders.gl/tiles';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { loadBatchedModelTile, loadPointTile } from './tile-parsers';

const DEBUG = false;

//temporales par implementar rapido region esferica
//Rotacion del root para antitransformar coordenadas  y verlas alineadas con los ejes del mapa en la depuracion
const rot1 = new THREE.Matrix4().makeRotationX((90 + 34.70838499415735) * Math.PI / 180);
const rot2 = new THREE.Matrix4().makeRotationZ((90 - 58.5348063426956) * Math.PI / 180);
const rot = rot2.multiply(rot1);
const rotI = new THREE.Matrix4().getInverse(rot);

// Create a THREE.Box3 from a 3D Tiles OBB
function createTHREEBoxFromOBB(box) {
  const center = new THREE.Vector3(box[0], box[1], box[2]);
  const xVector = new THREE.Vector3(box[3], box[4], box[5]);
  const yVector = new THREE.Vector3(box[6], box[7], box[8]);
  const zVector = new THREE.Vector3(box[9], box[10], box[11]);
  const trans = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);

  var iVersor = new THREE.Vector3(1, 0, 0);
  const kVersor = new THREE.Vector3(0, 0, 1);
  const axisRotZ = new THREE.Vector3(-zVector.y, zVector.x, 0).normalize();//producto cruz entre (0,0,1) y zBouding
  const anguloZ = kVersor.angleTo(zVector);
  const rotation1 = new THREE.Matrix4().makeRotationAxis(axisRotZ, anguloZ);
  iVersor.applyMatrix4(rotation1);
  const anguloX = iVersor.angleTo(xVector);
  const axisRotX = new THREE.Vector3(iVersor.x, iVersor.y, iVersor.z).cross(xVector).normalize();
  const rotation2 = new THREE.Matrix4().makeRotationAxis(axisRotX, anguloX);

  const x = xVector.length();
  const y = yVector.length();
  const z = zVector.length();

  const sw = new THREE.Vector3(-x, -y, -z);
  const ne = new THREE.Vector3(x, y, z);
  var boxR = new THREE.Box3(sw, ne);
  boxR.applyMatrix4(rotation1);
  boxR.applyMatrix4(rotation2);
  boxR.applyMatrix4(trans);

  return boxR;
}

function createTHREESphereFromOBB(box) {
  const center = new THREE.Vector3(box[0], box[1], box[2]);
  var rad = 0;
  for (var i = 3; i <= 11; i++) {
    rad += box[i] * box[i];
  }
  rad = Math.sqrt(rad);
  const sphere = new THREE.Sphere(center, rad);

  return sphere;
}

function createTHREEOutlineFromOBB(box) {

  const center = new THREE.Vector3(box[0], box[1], box[2]);
  const xVector = new THREE.Vector3(box[3], box[4], box[5]);
  const yVector = new THREE.Vector3(box[6], box[7], box[8]);
  const zVector = new THREE.Vector3(box[9], box[10], box[11]);
  var iVersor = new THREE.Vector3(1, 0, 0);
  const kVersor = new THREE.Vector3(0, 0, 1);
  const trans = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);

  const axisRotZ = new THREE.Vector3(-zVector.y, zVector.x, 0).normalize();//producto cruz entre (0,0,1) y zBouding

  const anguloZ = kVersor.angleTo(zVector);
  const rotation1 = new THREE.Matrix4().makeRotationAxis(axisRotZ, anguloZ);

  iVersor.applyMatrix4(rotation1);

  const anguloX = iVersor.angleTo(xVector);
  const axisRotX = new THREE.Vector3(iVersor.x, iVersor.y, iVersor.z).cross(xVector).normalize();
  const rotation2 = new THREE.Matrix4().makeRotationAxis(axisRotX, anguloX);

  const dimensions = new THREE.Vector3(xVector.length(), yVector.length(), zVector.length());

  const geom = new THREE.BoxGeometry(dimensions.x * 2, dimensions.y * 2, dimensions.z * 2);
  const edges = new THREE.EdgesGeometry(geom);
  var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
  line.applyMatrix(rotation1);
  line.applyMatrix(rotation2);
  line.applyMatrix(trans);

  return line;
}

function createTHREEOutlineSphereFromOBB(sphere) {
  const center = sphere.center;
  const trans = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);
  const rad = sphere.radius;
  const geom = new THREE.SphereGeometry(rad, 16, 8, 0, Math.PI, 0, Math.PI);
  const material = new THREE.MeshBasicMaterial({ color: 0x01ff01, wireframe: true, transparent: true, opacity: 0.1 });
  const sph = new THREE.Mesh(geom, material);
  sph.applyMatrix(rot);
  sph.applyMatrix(trans);

  return sph;
}

export default class TileHeader {
  // eslint-disable-next-line max-statements
  constructor(json, resourcePath, styleParams, parentRefine, isRoot, gltfUpAxis) {
    this.loaded = false;
    this.styleParams = styleParams;
    this.resourcePath = resourcePath;
    this.debug = DEBUG;
    this.gltfUpAxis = gltfUpAxis;
    this.boundingGeometry = null;
    this.firstCheck = true;
    this.isBox = false;
    this.isSphere = false;

    this._createTHREENodes();

    if (json.boundingVolume) {
      this.boundingVolume = json.boundingVolume;
      if (this.boundingVolume.box) {
        const boundingGeometry = this.boundingVolume.box;
        this.isBox = true;
        this.boundingGeometry = createTHREEBoxFromOBB(boundingGeometry);
        if (DEBUG) {
          this.totalContent.add(createTHREEOutlineFromOBB(boundingGeometry));
        }
      }
      else if (this.boundingVolume.sphere) {
        const boundingGeometry = this.boundingVolume.sphere;
        this.isSphere = true;
        this.boundingGeometry = createTHREESphereFromOBB(this.boundingVolume.box);
        if (DEBUG) {
          this.totalContent.add(createTHREEOutlineSphereFromOBB(this.boundingGeometry));
        }
      }
    }
    this._initTraversal(json, parentRefine, isRoot);
  }

  _initTraversal(json, parentRefine, isRoot) {
    this.refine = json.refine ? json.refine.toUpperCase() : parentRefine;
    this.geometricError = json.geometricError;
    this.transform = json.transform;
    if (this.transform && !isRoot) {
      // if not the root tile: apply the transform to the THREE js Group
      // the root tile transform is applied to the camera while rendering
      this.totalContent.applyMatrix(new THREE.Matrix4().fromArray(this.transform));
    }
    this.content = json.content;
    this.children = [];
    if (json.children) {
      for (let i = 0; i < json.children.length; i++) {
        const child = new TileHeader(
          json.children[i],
          this.resourcePath,
          this.styleParams,
          this.refine,
          false,
          this.gltfUpAxis
        );
        this.childContent.add(child.totalContent);
        this.children.push(child);
      }
    }
  }

  checkLoad(frustum, cameraPosition) {

    if (this.firstCheck === true) {
      //geometry.applyMatrix4(worldTransform);
      this.boundingGeometry.applyMatrix4(this.totalContent.matrixWorld);
      this.firstCheck = false;
    }
    const geometry = this.boundingGeometry;

    // is this tile visible?
    var invisibility = false;
    if (this.isBox) {
      /*Obtener centro de la region en el sistema del mapa */
      //geometry.getCenter(center);
      //center.applyMatrix4(rotI);
      if (!frustum.intersectsBox(geometry)) {
        invisibility = true;
      }
    }
    else if (this.isSphere) {
      //center = geometry.center;
      //center.applyMatrix4(rotI);
      if (!frustum.intersectsSphere(geometry)) {
        invisibility = true;
      }
    }
    /*Obtener posicion d ela camara en el sistema del mapa */
    //const camaraRot = new THREE.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z).applyMatrix4(rotI);

    if (invisibility === true) {
      this.unload(true);
      return;
    }

    const dist = geometry.distanceToPoint(cameraPosition);

    // are we too far to render this tile?
    if (this.geometricError > 0.0 && dist > this.geometricError * 250.0) {
      this.unload(true);
      return;
    } else {
      this.load();
    }

    // should we load this tile?
    if (this.children) {
      if (this.refine === 'REPLACE' && dist < this.geometricError * 20.0 && this.children.length != 0) {
        this.unload(false);
      }
    }
    // should we load its children?
    for (let i = 0; i < this.children.length; i++) {
      if (dist <= this.geometricError * 20.0) {
        this.children[i].checkLoad(frustum, cameraPosition);
      } else {
        this.children[i].unload(true);
      }
    }
  }

  unload(includeChildren) {
    this.tileContent.visible = false;
    if (includeChildren) {
      this.childContent.visible = false;
    } else {
      this.childContent.visible = true;
    }
    // TODO: should we also free up memory?
  }

  // eslint-disable-next-line max-statements, complexity
  async load() {
    this.tileContent.visible = true;
    this.childContent.visible = true;
    if (this.loaded) {
      return;
    }
    this.loaded = true;

    if (this.content) {
      let url = this.content.uri ? this.content.uri : this.content.url;
      if (!url) return;
      if (url.substr(0, 4) !== 'http') url = this.resourcePath + url;
      const type = url.slice(-4);
      switch (type) {
        case 'json':
          // child is a tileset json
          const response = await fetch(url);
          const tileset = await response.json();
          // loadTileset(url, this.styleParams);
          const resourcePath = THREE.LoaderUtils.extractUrlBase(url);
          const refine = tileset.root.refine ? tileset.root.refine.toUpperCase() : 'ADD';
          const gltfUp = tileset.asset.gltfUpAxis ? tileset.asset.gltfUpAxis : this.gltfUpAxis;
          if (tileset.root) {
            const child = new TileHeader(tileset.root,
              resourcePath,
              this.styleParams,
              refine,
              false,
              gltfUp);
            this.children.push(child);
            this.childContent.add(child.totalContent);
            // eslint-disable-next-line max-depth
            if (tileset.root.transform) {
              // the root tile transform of a tileset is normally not applied because
              // it is applied by the camera while rendering. However, in case the tileset
              // is a subset of another tileset, so the root tile transform must be applied
              // to the THREE js group of the root tile.
              tileset.root.totalContent.applyMatrix(
                new THREE.Matrix4().fromArray(tileset.root.transform)
              );
            }
          }
          break;

        case 'pnts':
          const pointTile = await loadPointTile(url);
          this._createPointNodes(pointTile, this.tileContent);
          break;

        case 'b3dm':
          const d = await loadBatchedModelTile(url);
          this._createGLTFNodes(d, this.tileContent);
          break;

        case 'i3dm':
          throw new Error('i3dm tiles not yet implemented');

        case 'cmpt':
          throw new Error('cmpt tiles not yet implemented');

        default:
          throw new Error(`invalid tile type: ${type}`);
      }
    }
  }

  // THREE.js instantiation
  _createTHREENodes() {
    this.totalContent = new THREE.Group(); // Three JS Object3D Group for this tile and all its children
    this.tileContent = new THREE.Group(); // Three JS Object3D Group for this tile's content
    this.childContent = new THREE.Group(); // Three JS Object3D Group for this tile's children
    this.totalContent.add(this.tileContent);
    this.totalContent.add(this.childContent);
  }

  _createPointNodes(d, tileContent) {
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(d.points, 3));
    const material = new THREE.PointsMaterial();
    material.size = this.styleParams.pointsize !== null ? this.styleParams.pointsize : 1.0;
    if (this.styleParams.color) {
      material.vertexColors = THREE.NoColors;
      material.color = new THREE.Color(this.styleParams.color);
      material.opacity = this.styleParams.opacity !== null ? this.styleParams.opacity : 1.0;
    } else if (d.rgba) {
      geometry.addAttribute('color', new THREE.Float32BufferAttribute(d.rgba, 4));
      material.vertexColors = THREE.VertexColors;
    } else if (d.rgb) {
      geometry.addAttribute('color', new THREE.Float32BufferAttribute(d.rgb, 3));
      material.vertexColors = THREE.VertexColors;
    }
    tileContent.add(new THREE.Points(geometry, material));
    if (d.rtc_center) {
      const c = d.rtc_center;
      tileContent.applyMatrix(new THREE.Matrix4().makeTranslation(c[0], c[1], c[2]));
    }
    tileContent.add(new THREE.Points(geometry, material));
    return tileContent;
  }

  _createGLTFNodes(d, tileContent) {
    const loader = new GLTFLoader();

    if (this.gltfUpAxis === "Y") {
      const rotateX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      tileContent.applyMatrix(rotateX); // convert from GLTF Y-up to Z-up
    }

    loader.parse(
      d.glbData,
      this.resourcePath,
      (gltf) => {
        if (this.styleParams.color !== null || this.styleParams.opacity !== null) {
          const color = new THREE.Color(this.styleParams.color);
          gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (this.styleParams.color !== null) child.material.color = color;
              if (this.styleParams.opacity !== null) {
                child.material.opacity = this.styleParams.opacity;
                child.material.transparent = this.styleParams.opacity < 1.0;
              }
            }
          });
        }
        /*
        const children = gltf.scene.children;
        for (let i=0; i<children.length; i++) {
          if (children[i].isObject3D)
            tileContent.add(children[i]);
        }
        */
        tileContent.add(gltf.scene);
      },
      (e) => {
        throw new Error(`error parsing gltf: ${e}`);
      }
    );
    return tileContent;
  }
}
