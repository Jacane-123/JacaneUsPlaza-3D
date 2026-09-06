import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { FFL, CharModel, FFLCharModelDescDefault, ModelIcon } from 'FFL.js';
import FFLShaderMaterial from 'FFL.js/materials/FFLShaderMaterial.js';
import ModuleFFL from 'FFL.js/ffl-emscripten.cjs';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

  // made by Jacopo Bava (aka JacaneU), following https://threejs.org/manual and more

//UI
// menu toggle
let isEscPressed = false;
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') isEscPressed = true;
});
window.addEventListener('keyup', (event) => {
  if (event.key === 'Escape') isEscPressed = false;
});
let menuVisible = false;
const menu = document.getElementById('menu');
menu.style.display = "none";
window.ToggleMenu = function() {
  menuVisible = !menuVisible;
  console.log("menu visible?" + menuVisible);
  if (menuVisible) {
    menu.style.display = "flex";
  } else {
    menu.style.display = "none";
  }
};
if ( isEscPressed ) ToggleMenu();



//Ambient
// color
const ambientColor = new THREE.Color( '#e4e9ed' );

// sky
scene.background = new THREE.Color( ambientColor );

// fog
scene.fog = new THREE.FogExp2( ambientColor, 0.05 );

// dust particlees
const dustParticles = [];
const dustGeometry = new THREE.SphereGeometry( 0.05, 16, 16 );
const dustMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0} );
for ( let i = 0; i < 20; i++ ) {
  const dust = new THREE.Mesh(  dustGeometry, dustMaterial.clone() );
  dust.position.x = Math.random() * 40 - 20;
  dust.position.y = Math.random() * 7 + 1;
  dust.position.z = Math.random() * 40 - 20;
  dust.userData = { state: 'fadingIn', visibleDuration: Math.random() * 3 + 2, timer: 0 };
  scene.add( dust );
  dustParticles.push( dust );
}

// light for obj models (test)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Luce diffusa globale
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0); // Luce diretta (es. Sole)
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);



//Objects
// minigame box placeholder DISABLED SINCE I DONT NEED IT FOR NOW
/** const minigameboxGeometry = new THREE.BoxGeometry( 0.5, 0.5, 0.15 );
const minigameboxTexture = new THREE.TextureLoader().load( 'public/textures/MinigameBoxes/BoxGlassBase.png' );
const minigameiconTexture = new THREE.TextureLoader().load( 'public/textures/MinigameBoxes/GameIcon.png' );
const minigameboxMaterial = new THREE.MeshBasicMaterial( { 
  map: minigameboxTexture,
  transparent: true } );
const minigamebox = new THREE.Mesh( minigameboxGeometry, minigameboxMaterial );
minigamebox.position.set(0, 1, 1);
scene.add( minigamebox ); */

// player
const objLoader = new OBJLoader();
const player = await objLoader.loadAsync( 'public/models/miiBody_F/miiBody_F.obj' );
const mtlLoader = new MTLLoader();
const playerMaterial = await mtlLoader.loadAsync( 'public/models/miiBody_F/miiBody_F.mtl' );
objLoader.setMaterials( playerMaterial );
player.position.set(0, 1, 0);
player.scale.set(0.003, 0.003, 0.003);
scene.add( player );
let miiMesh = null;
let username = null;


// floor
const floorGeometry = new THREE.PlaneGeometry( 50, 50 );
const floorTexture = new THREE.TextureLoader().load( 'public/textures/FloorTexture.png' );
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set( 10, 56 );
const floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture } );
const floor = new THREE.Mesh( floorGeometry, floorMaterial );
floor.rotation.x = -Math.PI / 2;
scene.add( floor );

//mii renderer
(async function () {
	const response = await fetch('FFLResMiddle.dat');
	const arrayBuffer = await response.arrayBuffer();
	const ffl = await FFL.initWithResource(
		new Response(arrayBuffer),
		ModuleFFL({
			locateFile: () => 'https://esm.sh/gh/ariankordi/FFL.js@v2.2.0/ffl-emscripten.wasm',
			INITIAL_MEMORY: 67108864
		})
	);
	function parseInputToBytes(text) {
		text = text.replace(/\s+/g, '');
		const isHex = /^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0;
		if (isHex) {
			return Uint8Array.from(text.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
		}
		return Uint8Array.from(atob(text), c => c.charCodeAt(0));
	}
	function updateMii() {
		const inputElement = document.getElementById('charDataInput');
		const rawText = (inputElement && inputElement.value.trim() !== '') 
			? inputElement.value.trim() 
			: 'AAAAAAkAAAAAAAAAAAAAAAAAAABlAAAARAAAgAAAAAAhAAAASQAAgAcAAAADAAAABAAAAAIAAAAQAAAAEgAAAEEAAIAIAAAAAwAAAAMAAAAMAAAABAAAAAAAAAAAAAAACwAAABcAAAATAACAAAAAAAMAAAANAAAAAAAAAAAAAAAIAACABAAAAAoAAAAEAAAARAAAgAYAAAAMAAAAAAAAAAQAAAACAAAAFAAAAAAAAAARAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
		const data = parseInputToBytes(rawText);
		if (miiMesh) {
			scene.remove(miiMesh);
		}
		const model = new CharModel(ffl, data, FFLCharModelDescDefault, FFLShaderMaterial, renderer);
		miiMesh = model.meshes;
		miiMesh.rotation.y = Math.PI;
		miiMesh.scale.set(0.02, 0.02, 0.02);
		scene.add(miiMesh);
	}
	updateMii();
	const updateButton = document.getElementById('updateMiiButton');
	if (updateButton) {
		updateButton.addEventListener('click', (e) => {
			e.preventDefault();
			updateMii();
		});
	}
})();

// username
function makeLabelCanvas( baseWidth, size, name ) {
  const borderSize = 2;
  const ctx = document.createElement( 'canvas' ).getContext( '2d' );
  const fontFamily = 'NintendoU';
  const font = `${size}px bold ${fontFamily}`;
  ctx.font = font;
  const textWidth = ctx.measureText( name ).width;
  const doubleBorderSize = borderSize * 2;
  const width = baseWidth + doubleBorderSize;
  const height = size + doubleBorderSize;
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.clearRect( 0, 0, width, height );
  const scaleFactor = Math.min( 1, baseWidth / textWidth );
  ctx.translate( width / 2, height / 2 );
  ctx.scale( scaleFactor, 1 );
  ctx.fillStyle = '#333333';
  ctx.fillText( name, 0, 0 );
  return ctx.canvas;
}

username = null;

function updateUsername() {
  const usernameInputElement = document.getElementById( 'usernameInput' );
  const usernameText = ( usernameInputElement && usernameInputElement.value.trim() !== '' ) 
    ? usernameInputElement.value.trim() 
    : 'Guest';

  if ( username ) {
    scene.remove( username );
    if ( username.material.map ) username.material.map.dispose();
    username.material.dispose();
  }

  const canvas = makeLabelCanvas( 150, 32, usernameText );
  const texture = new THREE.CanvasTexture( canvas );
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const labelMaterial = new THREE.SpriteMaterial( {
    map: texture,
    transparent: true,
  } );

  const labelBaseScale = 0.01;
  username = new THREE.Sprite( labelMaterial );
  username.scale.x = canvas.width * labelBaseScale;
  username.scale.y = canvas.height * labelBaseScale;

  scene.add( username );
}

updateUsername();

const usernameUpdateButton = document.getElementById( 'updateUsername' );
if ( usernameUpdateButton ) {
  usernameUpdateButton.addEventListener( 'click', ( e ) => {
    e.preventDefault();
    updateUsername();
  } );
}
		

//Controls 
// camera
const cameraPivot = new THREE.Object3D();
scene.add( cameraPivot );

let cameraDistance = 5;
camera.position.set( 0, 0, cameraDistance );
cameraPivot.add( camera );
const controls = new PointerLockControls( cameraPivot, renderer.domElement );
document.body.addEventListener( 'click', () => {
  if ( menuVisible ) return;
  controls.lock();
} );
document.addEventListener( 'wheel', ( event ) => {
  if ( controls.isLocked ) {
    cameraDistance += event.deltaY * 0.005;
    cameraDistance = Math.max( 0, Math.min( 15, cameraDistance ) );
    camera.position.z = cameraDistance;
  }
} );

//movement + jump + gravity + run
let isWPressed = false;
let isAPressed = false;
let isSPressed = false;
let isDPressed = false;
let isSpacePressed = false;
let isShiftPressed = false;

const cameraDirection = new THREE.Vector3();

document.addEventListener( 'keydown', ( event ) => {
  if ( event.code === 'KeyW' ) isWPressed = true;
  if ( event.code === 'KeyA' ) isAPressed = true;
  if ( event.code === 'KeyS' ) isSPressed = true;
  if ( event.code === 'KeyD' ) isDPressed = true;
  if ( event.code === 'Space' ) isSpacePressed = true;
  if ( event.code === 'ShiftLeft' )
    isShiftPressed = true;
} );

document.addEventListener( 'keyup', ( event ) => {
  if ( event.code === 'KeyW' ) isWPressed = false;
  if ( event.code === 'KeyA' ) isAPressed = false;
  if ( event.code === 'KeyS' ) isSPressed = false;
  if ( event.code === 'KeyD' ) isDPressed = false;
  if ( event.code === 'Space' ) isSpacePressed = false;
  if ( event.code === 'ShiftLeft' )
    isShiftPressed = false;
} );

let playerVelocityY = 0;
const gravity = 0.015;
const jumpForce = 0.25;
const raycaster = new THREE.Raycaster();
const downDirection = new THREE.Vector3( 0, -1, 0 );



//function animate
function animate( time ) {
  // player
  if ( miiMesh ) {
    miiMesh.position.copy( player.position );
    miiMesh.rotation.y = player.rotation.y;
    miiMesh.position.y = player.position.y + 1.35;
  }
  if ( username ) {
    username.position.copy( player.position );
    username.position.y = player.position.y + 2.5;
  }
	
  // run
  let movementSpeed = 0.085;
  if( isShiftPressed ) movementSpeed = 0.135;
  
  // movement
  let moveX = 0;
  let moveZ = 0;
  if ( isWPressed ) moveZ += 1;
  if ( isSPressed ) moveZ -= 1;
  if ( isAPressed ) moveX += 1;
  if ( isDPressed ) moveX -= 1;
  if ( ( moveX !== 0 || moveZ !== 0 ) && !menuVisible ) {
    camera.getWorldDirection( cameraDirection );
    const cameraAngle = Math.atan2( cameraDirection.x, cameraDirection.z );
    const inputAngle = Math.atan2( moveX, moveZ );
    player.rotation.y = cameraAngle + inputAngle + Math.PI;
    player.translateZ( -movementSpeed );
  }
  
  // gravity
  player.position.y += playerVelocityY;
  let isOnGround = false;
  raycaster.set( player.position, downDirection );
  const intersects = raycaster.intersectObject( floor  /* aggiungi qui altre puattaforme in futuro*/ );
  if ( intersects.length > 0 ) {
    const distanceToGround = intersects[0].distance;
    if ( distanceToGround <= 0.51 ) {
      isOnGround = true;
    }
  }
  if ( !isOnGround ) 
  {
    playerVelocityY -= gravity;
  }
  else if ( isOnGround )
  {
    playerVelocityY = 0;
    player.position.y = 0.5;
  }
  if ( player.position.y <= -2 ) {
	player.position.y = 1;
	player.position.x = 0;
	player.position.z = 0;
  }
  
  // jump
  if ( isSpacePressed && isOnGround )
  {
    playerVelocityY = + jumpForce;
  }
  
  // camera
  cameraPivot.position.copy( player.position );
  cameraPivot.position.y += 1.5;
  if ( cameraDistance < 0.5 ) {
	  player.visible = false;
  }
  else {
	  player.visible = true;
  }
	
  // dust
  const delta = 0.016; 
  for ( let i = 0; i < dustParticles.length; i++ ) 
  {
    const dust = dustParticles [ i ];
    const data = dust.userData;
    dust.position.y += 0.005;
    if ( data.state === 'fadingIn' ) {
      dust.material.opacity += delta * 2;
      if ( dust.material.opacity >= 1 ) {
        dust.material.opacity = 1;
        data.state = 'visible';
        data.timer = 0;
      }
    } 
    else if ( data.state === 'visible' ) {
      data.timer += delta;
      if ( data.timer >= data.visibleDuration ) {
        data.state = 'fadingOut';
      }
    } 
    else if ( data.state === 'fadingOut' ) {
      dust.material.opacity -= delta * 2;
      if ( dust.material.opacity <= 0 ) {
        dust.material.opacity = 0;
        dust.position.x = Math.random() * 40 - 20;
        dust.position.y = Math.random() * 7 + 1;
        dust.position.z = Math.random() * 40 - 20;
        data.visibleDuration = Math.random() * 3 + 2; 
        data.state = 'fadingIn';
      }
    }
  } 

  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );






