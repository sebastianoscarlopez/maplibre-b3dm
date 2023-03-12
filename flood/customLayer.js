export const floodLayer = () => {
  var modelOrigin = [-58.3815, -34.6033];
  var modelAltitude = -10;
  var modelRotate = [0, 0, 0];

  var modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
  );

  // transformation parameters to position, rotate and scale the 3D model onto the map
  var modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    /* Since our 3D model is in real world meters, a scale transform needs to be
    * applied since the CustomLayerInterface expects units in MercatorCoordinates.
    */
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
  };
  var THREE = window.THREE;

  // configuration of the custom layer for a 3D model per the CustomLayerInterface
  var customLayer = {
    id: "3d-model",
    type: "custom",
    renderingMode: "3d",
    onAdd: function (map, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // create two three.js lights to illuminate the model
      var directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.position.set(0, -70, 100).normalize();
      this.scene.add(directionalLight);

      var directionalLight2 = new THREE.DirectionalLight(0xffffff);
      directionalLight2.position.set(0, 70, 100).normalize();
      this.scene.add(directionalLight2);


      var boxGeometry = new THREE.BoxGeometry(10000, 10000, 1);
      var waterMaterial = new THREE.MeshBasicMaterial({ color: '#B8D2FF', opacity: 1 });
      // var waterMaterial = new THREE.MeshBasicMaterial({ color: '#50421D', opacity: 1 });
      const waterVertexShader = `
          uniform float time;
          varying vec2 vTextureCoord; // update variable name
          void main() {
            vTextureCoord = uv; // update variable name
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            gl_Position = projectedPosition;
          }
      `;
      const waterFragmentShader = `
          uniform float time;
          uniform vec2 resolution;
          varying vec2 vTextureCoord; // update variable name

          void main() {
            vec2 p = -1.0 + 2.0 * vTextureCoord; // update variable name
            p.x *= resolution.x / resolution.y;
            float dist = length(p);

            vec2 uv;
            uv.x = 0.5 + (vTextureCoord.x - 0.5) / (1.0 + 0.1 * dist); // update variable name
            uv.y = 0.5 + (vTextureCoord.y - 0.5) / (1.0 + 0.1 * dist); // update variable name
          float t = time * 0.1;
          vec2 uv0 = uv;
          uv0.x += sin(uv.y * 8.0 + t) * 0.04;
          uv0.y += sin(uv.x * 12.0 + t) * 0.02;
          vec2 uv1 = uv * vec2(2.0, 1.0) - vec2(1.0);
          vec4 noise = texture2D( texture1, uv1 );
          vec2 flow = vec2( (uv1.x - t * 0.1) * 1.5, (uv1.y - t * 0.1) * 1.5 );
          uv0 += flow * 0.1 * noise.x;
          uv0 = fract(uv0);
          vec4 reflection = texture2D(texture2, reflect(vec3(uv0, 0.0), vec3(0.0, 0.0, -1.0)));
          vec4 refraction = texture2D(texture2, refract(vec3(uv0, 0.0), vec3(0.0, 0.0, -1.0), 0.6));
          vec4 color = mix(reflection, refraction, 0.5);
          color += noise.y * 0.2;
          gl_FragColor = color;
        }`;

      // var waterMaterial = new THREE.ShaderMaterial({
      //   uniforms: {
      //     time: { value: 1.0 },
      //     resolution: { value: new THREE.Vector2() }
      //   },
      //   vertexShader: waterVertexShader,
      //   fragmentShader: waterFragmentShader
      // });
      var blueBox = new THREE.Mesh(boxGeometry, waterMaterial);

      this.scene.add(blueBox);

      this.map = map;

      // use the MapLibre GL JS map canvas for three.js
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });

      console.log('this.renderer', this.renderer)
      this.renderer.autoClear = false;
    },
    render: function (gl, matrix) {
      var rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
      );
      var rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
      );
      var rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
      );

      var m = new THREE.Matrix4().fromArray(matrix);
      var l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale * window.FLOOD
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.state.reset();
      this.renderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
    },
  };

  return customLayer;
};
