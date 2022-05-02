import * as THREE from 'three'

import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls";

//"https://unpkg.com/three@0.140.0/build/three.module.js"


const room_width = 30
const room_length = 10
const room_height = 3

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
document.getElementById("app").appendChild( renderer.domElement );

const ambientLight = new THREE.AmbientLight(0xf0f0f0,1)
scene.add(ambientLight)

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
cube.position.set(0,1,0)
scene.add( cube );

const tloader = new THREE.TextureLoader()
let texture = tloader.load('img/parquet-texture.webp')
texture.wrapS = texture.wrapT = THREE.RepeatWrapping
texture.repeat.set(room_width/2,room_length/2)
texture.anisotropy=16


const sol_material = new THREE.MeshLambertMaterial({map: texture})
const plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(room_width,room_length), sol_material)
plane.rotateX(-Math.PI / 2)
plane.position.set(0,0,0)
scene.add(plane)

texture = tloader.load('img/wall-texture.jpeg')
texture.wrapS = texture.wrapT = THREE.RepeatWrapping
texture.anisotropy=16

const l1 = [1,0,-1,0]
const l2 = [0,1,0,-1]
for (let i = 0; i < 4; i++) {
    const wall_material = new THREE.MeshLambertMaterial({map: texture, side: THREE.DoubleSide})
    const wall = new THREE.Mesh(new THREE.PlaneBufferGeometry(Math.max(room_length,room_width),3), wall_material)
    wall.position.set(
        l1[i]*room_width/2,
        room_height/2,
        l2[i]*room_length/2
    )
    wall.rotateY(l1[i]*Math.PI / 2)
    scene.add(wall)
}


let isNotInGame = true;

const controls = new PointerLockControls(camera, renderer.domElement );
const startButton = document.getElementById("start")
startButton.addEventListener('click', function () {
    controls.lock()
})
let keys = [];
document.addEventListener('keydown',keydown);
document.addEventListener('keyup',keyup);


function unlockedCursor() {
    isNotInGame = true
    startButton.style.display = 'block'
}

function lockedCursor() {
    isNotInGame = false
    startButton.style.display = 'none'
}
window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}
controls.addEventListener('unlock', unlockedCursor, false);
controls.addEventListener('lock', lockedCursor, false)


function keydown(e){
    if(isNotInGame){
        return;
    }
    keys[e.key] = true;
}
function keyup(e){
    keys[e.key] = false;
}


camera.position.z = 5;
camera.position.y = 1

function animate() {
    requestAnimationFrame( animate );

    if(keys['z']){
        controls.moveForward(.1);
    }
    if(keys['s']){
        controls.moveForward(-.1);
    }
    if(keys['q']){
        controls.moveRight(-.1);
    }
    if(keys['d']){
        controls.moveRight(.1);
    }
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render( scene, camera );
}

animate();

function pytha(sideA, sideB){
    return Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));
}