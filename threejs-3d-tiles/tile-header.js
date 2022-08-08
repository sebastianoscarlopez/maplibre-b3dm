import * as THREE from 'three';
import {Tileset3D} from '@loaders.gl/tiles';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { loadBatchedModelTile, loadPointTile } from './tile-parsers';

const DEBUG = true;

// Create a THREE.Box3 from a 3D Tiles OBB
function createTHREEBoxFromOBB(box) {
  const center = new THREE.Vector3(box[0], box[1], box[2]);
  const trans = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);
  const rot1 = new THREE.Matrix4().makeRotationX((90 + 34.528457957255185) * Math.PI / 180);
  const rot2 = new THREE.Matrix4().makeRotationZ((90 - 58.5348063426956) * Math.PI / 180);
  const x = Math.sqrt(box[3]*box[3]+box[4]*box[4]+box[5]*box[5]);
  const y = Math.sqrt(box[9]*box[9]+box[10]*box[10]+box[11]*box[11]);
  const z = Math.sqrt(box[6]*box[6]+box[7]*box[7]+box[8]*box[8]);
  const sw = new THREE.Vector3(-x, -y, -z);
  const ne = new THREE.Vector3( x,  y,  z);
  const boxR = new THREE.Box3(sw, ne);
  boxR.applyMatrix4(rot1);
  boxR.applyMatrix4(rot2);
  boxR.applyMatrix4(trans);

  return boxR;
}

function createTHREESphereFromOBB(box) {
  const center = new THREE.Vector3(box[0], box[1], box[2]);
  var rad = 0;
  for (var i = 3; i <= 11; i++) {
    rad += box[i] * box[i];
  }
  rad = Math.sqrt(rad );
  const sphere = new THREE.Sphere(center, rad);

  return sphere;
}

function createTHREEOutlineFromOBB(box) {
  const center = new THREE.Vector3(box[0], box[1], box[2]);
  const trans = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);
  const rot1 = new THREE.Matrix4().makeRotationX((90 + 34.70838499415735) * Math.PI / 180);
  const rot2 = new THREE.Matrix4().makeRotationZ((90 - 58.5348063426956) * Math.PI / 180);
  const x = Math.sqrt(box[3]*box[3]+box[4]*box[4]+box[5]*box[5]);
  const z = Math.sqrt(box[9]*box[9]+box[10]*box[10]+box[11]*box[11]);
  const y = Math.sqrt(box[6]*box[6]+box[7]*box[7]+box[8]*box[8]);
  const geom = new THREE.BoxGeometry(x * 2, y * 2, z * 2);
  const edges = new THREE.EdgesGeometry(geom);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
  line.applyMatrix(rot1);
  line.applyMatrix(rot2);
  line.applyMatrix(trans);

  return line;
}

function createTHREEOutlineSphereFromOBB(sphere) {
  const center = sphere.center;
  const trans = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);
  const rot1 = new THREE.Matrix4().makeRotationX((90 + 34.70838499415735) * Math.PI / 180);
  const rot2 = new THREE.Matrix4().makeRotationZ((90 - 58.5348063426956) * Math.PI / 180);
  const rad = sphere.radius;
  const geom = new THREE.SphereGeometry(rad, 16, 8, 0, Math.PI, 0, Math.PI);
  const material = new THREE.MeshBasicMaterial({ color: 0x01ff01 , wireframe: true, transparent: true, opacity: 0.1});
  const sph = new THREE.Mesh(geom, material);
  sph.applyMatrix(rot1);
  sph.applyMatrix(rot2);
  sph.applyMatrix(trans);

  return sph;
}

export default class TileHeader {
  // eslint-disable-next-line max-statements
  constructor(json, resourcePath, styleParams, parentRefine, isRoot, gltfUpAxis ) {
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
      if (this.boundingVolume.box && false) {
        const boundingGeometry = this.boundingVolume.box;
        this.isBox = true;
        this.boundingGeometry = createTHREEBoxFromOBB(boundingGeometry);
        if (DEBUG) {
          this.totalContent.add(createTHREEOutlineFromOBB(boundingGeometry));
        }
      }
      else if (this.boundingVolume.sphere || true) {
        const boundingGeometry = this.boundingVolume.box;
        this.isSphere = true;
        this.boundingGeometry = createTHREESphereFromOBB(boundingGeometry);
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
    var tLevel = -1;
    if (this.content) {
      var _url = this.content.uri ? this.content.uri : this.content.url;
      if (!_url) return;
      tLevel = _url.replace(/.+_lv([\d]{0,2}).+/, '$1');
      console.log(`Checkload nivel ${tLevel}:`);
    }
    else{
      console.log('Checkload probem, el hijo no tiene contenido');
    }    
    const geometry = this.boundingGeometry;
    const worldTransform = this.totalContent.matrixWorld;
    var center = new THREE.Vector3();

    if(this.firstCheck === true){
      geometry.applyMatrix4(worldTransform);
      this.firstCheck = false;
    }

    // is this tile visible?
    var invisibility = false;
    if(this.isBox ){
      geometry.getCenter(center);
      if (!frustum.intersectsBox(geometry)) {
        invisibility = true;
      }
    }
     else if (this.isSphere) {
      center = geometry.center;
      if (!frustum.intersectsSphere(geometry)) {
        invisibility = true;
      }
    }
    console.log(`   La posición de la región es: ${center.x}, ${center.y}, ${center.z}`);
    console.log(
`   La posición de la camara es:
      x: ${cameraPosition.x}
      y: ${cameraPosition.y}
      z: ${cameraPosition.z}`);
    if (invisibility === true ){
      console.log(`   EL tile no esta adentro de su limite`);
      this.unload(true);
      console.log(`   Tile e hijos invisibles`);
      return;
    }

    const dist = geometry.distanceToPoint(cameraPosition);
    console.log(`   La distancia de la geometria a la camara es: ${dist} metros.`);

    // are we too far to render this tile?
    if (this.geometricError > 0.0 && dist > this.geometricError * 50.0) {
      
      this.unload(true);
      return;
    }

    // should we load this tile?

    if (this.refine === 'REPLACE' && dist < this.geometricError * 20.0 && this.children.length >= 1) {
//    if (this.refine === 'REPLACE' && dist < this.geometricError * 20.0 ) {
      this.unload(false);
    } else {
      this.load();
    }

    // should we load its children?
    console.log(`   Hay  ${this.children.length} hijos en el ${tLevel}.`);
    for (let i = 0; i < this.children.length; i++) {
      if (dist < this.geometricError * 50.0) {
        console.log(`   El hijo ${i} esta cerca de la camara. Ejecutando Checkload...`);
        if (this.children && this.children[i] && this.children[i].checkLoad){
          this.children[i].checkLoad(frustum, cameraPosition);
        }
        else {
          console.log(`   los hijos son ${typeof this.children[i]}`);
        }
      } else {
        console.log(`   El hijo ${i} esta muy lejos d ela camara`);
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
      console.log(`cargando url: ${url} `);
      switch (type) {
        case 'json':
          // child is a tileset json
          const response = await fetch(url);
          const tileset = await response.json();
          // loadTileset(url, this.styleParams);
          const resourcePath = THREE.LoaderUtils.extractUrlBase(url);
          console.log(`el path es del json es ${resourcePath}`);
//          const refine = tileset.root.refine ? tileset.root.refine.toUpperCase() : 'ADD';
          if (tileset.root) {
            console.log(`el json tiene root`);
            const child = new TileHeader( tileset.root, 
              resourcePath, 
              this.styleParams, 
              this.refine, 
              false, 
              this.gltfUpAxis);
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
