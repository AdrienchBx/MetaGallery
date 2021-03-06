import * as THREE from 'three' //'https://unpkg.com/three@0.140.0/build/three.module.js'
import Stats from 'stats.js'
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls";
import {VRButton} from "three/examples/jsm/webxr/VRButton";
//import {getEquipementsImgs, getEquipmentsText, getProjectsImgs} from "./scraper";
//import {getProjectText} from "./scraper";
import ThreeMeshUI from 'three-mesh-ui'
import {XRControllerModelFactory} from "three/examples/jsm/webxr/XRControllerModelFactory";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import FontJSON from '../fonts/BreadleySansRegular-MVyEB-msdf/BreadleySansRegular-MVyEB-msdf.json';
import FontImage from '../fonts/BreadleySansRegular-MVyEB-msdf/BreadleySansRegular-MVyEB.png';


///////////////
//ROOMS CONFIGS
///////////////
const rooms_width = 10
const rooms_height = 3
const couloirWidth = 1.5
const couloirlenght = 3

const artSpacement = 5
const artSize = 2

let nbTextsLoaded = 0

let isNotInGame = true;
let lastPosition


let clock = new THREE.Clock()
let delta = 0

let cameraVector = new THREE.Vector3();
const prevGamePads = new Map();

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)


let speedFactor = [5, 5, 5, 5];
let textsInRoom = []
let spots = []
let keys = [];
let boundingBoxes = []
const intersected = []
//NON FONCTIONNEL DU A UNE REDIRECTION EN RAISON DU CHANGEMENT D'URL (AU NIVEAU DES IMAGES)
//const ProjectsImgList = getProjectsImgs()
/////////////////////
//First room's images
/////////////////////

//NON FONCTIONNEL DU A UNE REDIRECTION EN RAISON DU CHANGEMENT D'URL (AU NIVEAU DES IMAGES)
//const ProjectsImgList = getProjectsImgs()
const ProjectsImgList = ['../ProjectsMiniaturesImgs/thumbnail1.png', '../ProjectsMiniaturesImgs/thumbnail2.png',
    '../ProjectsMiniaturesImgs/thumbnail3.png', '../ProjectsMiniaturesImgs/thumbnail4.png',
    '../ProjectsMiniaturesImgs/thumbnail5.png', '../ProjectsMiniaturesImgs/thumbnail6.png',
    '../ProjectsMiniaturesImgs/thumbnail7.png', '../ProjectsMiniaturesImgs/thumbnail8.png']

//////////////////////
//Second room's images
//////////////////////

//NON FONCTIONNEL DU A UNE REDIRECTION EN RAISON DU CHANGEMENT D'URL (AU NIVEAU DES IMAGES)
//const EquipmentsImgList = getEquipementsImgs()
const EquipmentsImgList = ['../EquipmentsMiniaturesImgs/thumbnail1.png', '../EquipmentsMiniaturesImgs/thumbnail2.png',
    '../EquipmentsMiniaturesImgs/thumbnail3.png', '../EquipmentsMiniaturesImgs/thumbnail4.png', '../EquipmentsMiniaturesImgs/thumbnail5.png']

/////////////////////////////
//Art pieces details (images)
/////////////////////////////
const tabData = ['../PagesImgs/page1.png', '../PagesImgs/page2.png', '../PagesImgs/page3.png', '../PagesImgs/page4.png', '../PagesImgs/page5.png', '../PagesImgs/page6.png'
    , '../PagesImgs/page7.png', '../PagesImgs/page8.png', '../PagesImgs/page9.png', '../PagesImgs/page10.png', '../PagesImgs/page11.png', '../PagesImgs/page12.png', '../PagesImgs/page13.png']

//Total number of art pieces
const nbArts = ProjectsImgList.length + EquipmentsImgList.length
//Array of number of art pieces contained in each room
const roomsNbArts = [ProjectsImgList.length, EquipmentsImgList.length]
//Rooms lengths
const roomsLengths = [getRoomLength(ProjectsImgList.length), getRoomLength(EquipmentsImgList.length)]
//Total sim's size
const total_length = getRoomLength(nbArts)
//Array of positions defined for each art piece
const artPositions = getArtPositions()

const tloader = new THREE.TextureLoader()

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 0
camera.position.y = 1.5

//Object on wich the camera is attached, used to move the camera especially in vr
const dolly = new THREE.Object3D()
dolly.position.z = 5
dolly.add(camera)
scene.add(dolly)
lastPosition = dolly.position.clone()
//Fake camera used for vector buffering
const stupCam = new THREE.Object3D()
camera.add(stupCam)

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement);

//keyboard controls
const controls = new PointerLockControls(camera, renderer.domElement);
const startButton = document.getElementById("start")
startButton.addEventListener('click', function () {
    controls.lock()
})

//sphere arround the player to check for wall collisions
const geometry = new THREE.SphereGeometry(0.25, 10, 10);
const material = new THREE.MeshBasicMaterial();
material.opacity = 0
material.transparent = true
const sphere = new THREE.Mesh(geometry, material);
dolly.add(sphere)

//Bounding box wich will actually detect the collision
const dollyBB = new THREE.Box3()
sphere.geometry.computeBoundingBox()
dollyBB.copy(sphere.geometry.boundingBox).applyMatrix4(sphere.matrixWorld);

//add enter vr button
const vrbut = VRButton.createButton(renderer)
document.body.appendChild(vrbut)

//setup vr/controllers
renderer.xr.enabled = true;
let controller1 = renderer.xr.getController(0)
let controller2 = renderer.xr.getController(1)
dolly.add(controller1)
dolly.add(controller2)

//Display the controller inside the sim
const controllerModelFactory = new XRControllerModelFactory();
let controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
dolly.add(controllerGrip1);

let controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
dolly.add(controllerGrip2);

//Draw a line from the controller to see where it's poiting
const linegeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
const linemat = new THREE.LineBasicMaterial({
    color: 0xffffff
});
const controllerLine = new THREE.Line(linegeo, linemat);
controllerLine.name = 'line';
controllerLine.scale.z = 5;

controller1.add(controllerLine.clone());
controller2.add(controllerLine.clone());
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
controller2.addEventListener('selectstart', onSelectStart);
controller2.addEventListener('selectend', onSelectEnd);

document.addEventListener('keydown', keydown);
document.addEventListener('keyup', keyup);
document.addEventListener('mousedown',onEPressed)
document.addEventListener('mouseup',onEReleased)

window.addEventListener('resize', onWindowResize, false);

controls.addEventListener('unlock', unlockedCursor, false);
controls.addEventListener('lock', lockedCursor, false)

//This group will be constituted of the arts and will be used to detect collision with the ray casted from the controllers/camera
let group = new THREE.Group()
scene.add(group)
const tempMatrix = new THREE.Matrix4();
let raycaster = new THREE.Raycaster()

//Add all objects to the scene
createRoom(roomsLengths[0], rooms_width, rooms_height, 0, 0, false, true)
createCouloir(0, roomsLengths[0])
createRoom(roomsLengths[1], rooms_width, rooms_height, 0, roomsLengths[0] + couloirlenght, true, false)
loadDescriptionPages()
displayAllArts()
putSpots()


//load sky texture
const texciel = tloader.load('img/sky.jpg')
texciel.wrapS = texciel.wrapT = THREE.RepeatWrapping
texciel.repeat.set(rooms_width / 10, total_length / 10)
texciel.anisotropy = 16
const ciel_material = new THREE.MeshLambertMaterial({map: texciel, side: THREE.DoubleSide})
const ciel = new THREE.Mesh(new THREE.PlaneBufferGeometry(1500, 1500), ciel_material)
ciel.rotateX(-Math.PI / 2)
ciel.position.set(0, 30, (total_length / 2))
scene.add(ciel)

//set lighting
const ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.8)
scene.add(ambientLight)

//create instructions panel
const instructions = new ThreeMeshUI.Block( {
    width: 2,
    height: 1.5,
    fontSize: 0.055,
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily: FontJSON,
    fontTexture: FontImage,
    borderRadius: 0.2,
    borderWidth: 0.02,
    borderColor: new THREE.Color(0.8,0,0.6),
    bestFit: 'auto'
} );

instructions.add(
    new ThreeMeshUI.Text( {
        content: 'Bienvenue dans la galerie metaversielle du PIRVI\n-Pour vous d??placer, utilisez les touches Z,Q,S,D ou les joysticks de vos controllers\n'+
                 '-Pour afficher le d??tail d\'un projet, cliquez dessus avec votre souris ou avec votre boutton "trigger"\n' +
                 '-Vous pouvez ??galement d??placer le d??tail ?? l\'aide d\'un "drag and drop"'
    } )
);
instructions.rotateX(-0.5)
instructions.position.set(0,1,1.5)
scene.add(instructions)

//add human 3d model
const gltfLoader = new GLTFLoader()

const map = tloader.load('../BrandonFull/Brandon.png')
map.flipY = false
let brandon = new THREE.Object3D()

await gltfLoader.load(
    '../BrandonFull/Brandon.glb',
    function ( gltf ) {
        let mesh = gltf.scene.children[0];
        mesh.material = new THREE.MeshPhongMaterial({
            map: map
        });
        mesh.scale.set(0.001,0.001,0.001)
        mesh.position.set(0,1.2,8)
        mesh.rotateZ(-0.15)
        mesh.rotateX(0.15)
        brandon = mesh
        scene.add( mesh );
    },
    function ( xhr ) {
        console.log( ('3d human model is '+ xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    function ( error ) {
        console.log( 'An error happened ' + error);
    }
);


function animate() {
    stats.begin()
    ThreeMeshUI.update()

    cleanIntersected();
    if(renderer.xr.isPresenting){
        intersectObjects( controller1 );
        intersectObjects( controller2 );
    }else {
        intersectCamObjects(camera)
    }

    checkBounderies()
    delta = clock.getDelta()
    handleMovement(delta)
    dollyMove(delta)
    brandon.rotation.z += 0.01
    renderer.render(scene, camera);
    stats.end()
}

function onSelectStart(event) {
    const controller = event.target;

    const intersections = getIntersections(controller);

    if (intersections.length > 0) {

        const intersection = intersections[0];

        const object = intersection.object;
        if (object.name.startsWith("art")) {
            let num = parseInt(object.name.substring(4))
            textsInRoom[num].visible = (textsInRoom[num].visible !== true)
        } else {
            object.material.emissive.b = 1;
            controller.attach(object);
            controller.userData.selected = object;
        }
    }
}

function onSelectEnd(event) {
    const controller = event.target;

    if (controller.userData.selected !== undefined) {

        const object = controller.userData.selected;
        object.material.emissive.b = 0;
        group.attach(object);

        controller.userData.selected = undefined;

    }

}


function unlockedCursor() {
    isNotInGame = true
    startButton.style.display = 'block'
    //vrbut.setAttribute('style','display: block')
}

function lockedCursor() {
    isNotInGame = false
    startButton.style.display = 'none'
    //vrbut.setAttribute('style','display: none')

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}

/*function showInfo() {
    if (!isInfoDisplayed[closestArtIndex] && allowAction) {
        textsInRoom[closestArtIndex].visible = true
        spots[closestArtIndex].target.position.z += (closestArtIndex % 2 === 0) ? -2.5 : 2.5
        spots[closestArtIndex].target.updateMatrixWorld()
        isInfoDisplayed[closestArtIndex] = true
    } else if (isInfoDisplayed[closestArtIndex] && allowAction) {
        textsInRoom[closestArtIndex].visible = false
        spots[closestArtIndex].target.position.z += (closestArtIndex % 2 === 0) ? 2.5 : -2.5
        spots[closestArtIndex].target.updateMatrixWorld()
        isInfoDisplayed[closestArtIndex] = false
    }
}*/

/**
 * En focntion de la touche appuy??e d??clanche l'action associ??e
 * @param e event clavier
 */
function keydown(e) {
    if (isNotInGame) {
        return;
    }
    keys[e.key] = true;
}

function keyup(e) {
    keys[e.key] = false;
}

/**
 * Colisions avec les murs
 */
function checkBounderies() {
    dollyBB.copy(sphere.geometry.boundingBox).applyMatrix4(sphere.matrixWorld);
    for (let i = 0; i < boundingBoxes.length; i++) {
        if (dollyBB.intersectsBox(boundingBoxes[i])) {
            dolly.position.set(lastPosition.x, lastPosition.y, lastPosition.z)
        }
    }
}


/**
 * Handler des mouvement au clavier
 */
function handleMovement(delta) {
    lastPosition = dolly.position.clone()
    let camVector = new THREE.Vector3()
    stupCam.getWorldDirection(camVector)
    camVector.y = 0
    if (keys['z']) {
        dolly.translateOnAxis(camVector, -0.1 * delta * speedFactor[0] * 5)
    }
    if (keys['s']) {
        dolly.translateOnAxis(camVector, 0.1 * delta * speedFactor[1] * 5)
    }
    if (keys['q']) {
        dolly.position.x -= camVector.z  * delta * speedFactor[2]/2
        dolly.position.z += camVector.x  * delta * speedFactor[2]/2
    }
    if (keys['d']) {
        dolly.position.x += camVector.z * delta * speedFactor[3]/2
        dolly.position.z -= camVector.x * delta * speedFactor[3]/2
    }
}

/**
 * Affiche une oeuvre d'art
 * @param x position sur x
 * @param z position sur z
 * @param imgUrl lien vers l'image (local/distant)
 * @param artNumber index de l'oeuvre
 * @param hasTitle Affiche le titre de l'oeuvre bas?? sur son lien
 */
function displayArtAt(x, z, imgUrl, artNumber,hasTitle) {
    if(hasTitle){
        const panel = new ThreeMeshUI.Block( {
            width: 1,
            height: 0.2,
            fontSize: 0.055,
            justifyContent: 'center',
            textAlign: 'center',
            fontFamily: FontJSON,
            fontTexture: FontImage,
            borderRadius: 0.2,
            bestFit: 'auto'
        } );
        const txt = imgUrl.split("/")[2].replace(".png","")
        panel.add(
            new ThreeMeshUI.Text( {
                content: txt,
            } )
        );
        panel.rotateY((x<0)?Math.PI/2:-Math.PI/2)
        panel.position.set((x<0)?x+0.01:x-0.01,2.1,z)
        scene.add(panel)
    }
    const textureProj = tloader.load(imgUrl, (tex) => {
        const imgWidth = tex.image.width
        const imgHeight = tex.image.height
        const ratio = imgHeight / imgWidth
        const toile = new THREE.BoxGeometry(artSize, ratio * artSize, 0.1)
        const material = new THREE.MeshLambertMaterial({map: textureProj})
        const art = new THREE.Mesh(toile, material)
        art.rotateY(Math.PI / 2)
        art.position.set(x, 1.5, z)
        art.name = 'art ' + artNumber
        group.add(art)
    })
}

/**
 * Affiche toutes les oeuvres dont les liens sont disponible dans les listes "ProjectsImgList" et "EquipmentsImgList"
 */
function displayAllArts() {
    let i = 0
    let artNumber = 0
    for (; i < ProjectsImgList.length; i++) {
        displayArtAt(artPositions[i].x, artPositions[i].z, ProjectsImgList[i],artNumber++,true)
    }
    const tmp = ProjectsImgList.length
    for (let j = tmp; j < EquipmentsImgList.length + tmp; j++) {
        displayArtAt(artPositions[j].x, artPositions[j].z, EquipmentsImgList[j - tmp],artNumber++,true)
    }
}

/**
 * Affiche une image invisible
 * @param x x de l'image
 * @param z z de l'image
 * @param url lien de l'image (local/distant)
 * @param pageNumber index de l'oeuvre associ??e
 */
function putInvisiblePageAt(x, z, url, pageNumber) {
    const textureProj = tloader.load(url, (tex) => {
        const imgWidth = tex.image.width
        const imgHeight = tex.image.height
        const ratio = imgHeight / imgWidth
        const toile = new THREE.BoxGeometry(artSize, ratio * artSize, 0.1)
        const material = new THREE.MeshLambertMaterial({map: textureProj})
        const art = new THREE.Mesh(toile, material)
        if (x < 0) {
            art.rotateY(Math.PI / 2)
            z = z - artSize - 1.1
            //x += 0.05
        } else {
            art.rotateY(-Math.PI / 2)
            //x -= 0.05
            z += 1.1
        }
        art.position.set(x, 1.5, z)
        art.visible = false
        art.name = 'page ' + pageNumber
        textsInRoom[pageNumber] = art
        group.add(art)
        //scene.add(art)
        nbTextsLoaded++
        if (nbTextsLoaded === nbArts) {
            document.getElementById("loader").style.display = 'none'
        }
    })
}

/**
 * Calcule la distance entre 2 points
 * @param x1 x premier point
 * @param y1 y premier point
 * @param x2 x deuxi??me point
 * @param y2 y deuxi??me point
 * @returns {number} r??sultat en m??tres
 */
/*function getDistance(x1, y1, x2, y2) {
    let y = x2 - x1;
    let x = y2 - y1;
    return Math.sqrt(x * x + y * y);
}*/

/**
 * D??fini les positions de toutes les oeuvres en prennant l'espacement et la pi??ce dans laquelle elles se trouvent en compte
 * @returns {*[]} Liste des positions des oeuvres
 */
function getArtPositions() {
    let res = []
    let offset = 0
    for (let i = 0; i < roomsNbArts.length; i++) {
        for (let j = 0; j < roomsNbArts[i]; j++) {
            res.push({
                x: ((j % 2 === 1) ? 1 : -1) * rooms_width / 2,
                z: offset + 1.5 + (artSpacement / 2 + (Math.floor(j / 2)) * artSpacement)
            })
        }
        offset = roomsLengths[i] + couloirlenght
    }
    return res
}

/**
 * D??fini la longueur d'une salle en fonction du nombres d'oeuvres qu'elle doit contenir
 * @param nbArts Nombre d'oeuvres dans la salle
 * @returns {number} Taille en m??tres
 */
function getRoomLength(nbArts) {
    return (Math.floor((nbArts + 1) / 2)) * artSpacement + 3
}

/**
 * Ajoute toutes les screenshots des pages web d??crivant les oeuvres d'art
 */
function loadDescriptionPages() {
    let i = 0
    for (; i < nbArts; i++) {
        putInvisiblePageAt(artPositions[i].x, artPositions[i].z + artSize / 2, tabData[i], i)
    }
}

/**
 * Positionne des spots lumineux ??cliarant les "oeuvres d'art"
 */
function putSpots() {
    artPositions.forEach(p => {
        const spotLight = new THREE.SpotLight(0xffffff);
        spotLight.target.position.set(p.x, rooms_height / 2, p.z)
        spotLight.target.updateMatrixWorld();
        spotLight.intensity = 0.3
        spotLight.angle = Math.PI / 6
        spotLight.distance = 5
        spotLight.position.set(p.x < 0 ? p.x + 2 : p.x - 2, rooms_height, p.z);
        spotLight.castShadow = false;
        spots.push(spotLight)
        scene.add(spotLight);
    })
}

/**
 * Bouge le dolly en focntion des valeurs des controlleurs
 */
function dollyMove(delta) {
    let handedness = "unknown";
    const session = renderer.xr.getSession();
    //si on est dans une session vr
    if (session) {
        let xrCamera = renderer.xr.getCamera(camera);
        xrCamera.getWorldDirection(cameraVector);
        //Evite erreur console si on n'a qu'une seule entr??e
        if (isIterable(session.inputSources)) {
            for (const source of session.inputSources) {
                if (source && source.handedness) {
                    handedness = source.handedness; //controlleur gauche/droit
                }
                if (!source.gamepad) continue;
                const old = prevGamePads.get(source);
                const data = {
                    handedness: handedness,
                    buttons: source.gamepad.buttons.map((b) => b.value),
                    axes: source.gamepad.axes.slice(0)
                };
                if (old) {
                    //handlers pour joysticks
                    data.axes.forEach((value, i) => {
                        //si le mouvement du joystick d??passe la marge d'erreur
                        if (Math.abs(value) > 0.2) {
                            //valeur de l'axe horizontal des joysticks
                            if (i === 2) {
                                //si joystick du controlleur gauche
                                if (data.handedness === "left") {
                                    //d??placement du dolly en fonction de la valeur renvoy??e par le joystick/vecteur vitesse choisi/l'orientation de la cam
                                    dolly.position.x -= cameraVector.z * speedFactor[i] * data.axes[2]/2 * delta;
                                    dolly.position.z += cameraVector.x * speedFactor[i] * data.axes[2]/2 * delta;
                                }
                                //joystick controlleur droit
                                else {
                                    dolly.position.x -= cameraVector.z * speedFactor[i] * data.axes[2]/2 * delta;
                                    dolly.position.z += cameraVector.x * speedFactor[i] * data.axes[2]/2 * delta;
                                }
                            }
                            //valeur de l'axe vertical des joysticks
                            if (i === 3) {
                                //si joystick du controlleur gauche
                                if (data.handedness === "left") {
                                    dolly.position.x -= cameraVector.x * speedFactor[i] * data.axes[3]/2 * delta;
                                    dolly.position.z -= cameraVector.z * speedFactor[i] * data.axes[3]/2 * delta;
                                }
                                //joystick controlleur droit
                                else {
                                    dolly.position.x -= cameraVector.x * speedFactor[i] * data.axes[3]/2 * delta;
                                    dolly.position.z -= cameraVector.z * speedFactor[i] * data.axes[3]/2 * delta;
                                }
                            }
                        }
                    });
                }
                //sauvegarde pour comparaison a la frame suivante
                prevGamePads.set(source, data);
            }
        }
    }
}

/**
 * Est ce que l'objet est it??rable?
 * @param obj Objet dont il faut v??rifier l'it??rabilit??
 * @returns {boolean} It??rable? Oui/Non
 */
function isIterable(obj) {
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === "function";
}

/**
 * Cette fonction permet de cr????er une pi??ce en fonction de ses dimensions, de sa position et
 * du fait qu'elle soit "ouverte" ou non aux extr??mit??s
 * @param length longueur de la pi??ce
 * @param width largeur de la pi??ce
 * @param height hauteur de la pi??ce
 * @param x position en x du d??but de la pi??ce
 * @param z position en z du d??but de la pi??ce
 * @param isOpenedAtZstart est ce qu'il y a un "trou" dans le mur pour un acc??s a un couloir en d??but de pi??ce
 * @param isOpenedAtZend est ce qu'il y a un "trou" dans le mur pour un acc??s a un couloir en fin de pi??ce
 */
function createRoom(length, width, height, x, z, isOpenedAtZstart, isOpenedAtZend) {
    //chargement de la texture du sol
    let texture = tloader.load('img/parquet.jpg')

    //r??p??tition de la texture
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(width / 2, length / 2)
    texture.anisotropy = 16


    const sol_material = new THREE.MeshLambertMaterial({map: texture})
    const plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(width, length), sol_material)
    plane.rotateX(-Math.PI / 2)
    plane.position.set(x, 0, z + (length / 2))
    scene.add(plane)

    //chargement de la texture des murs
    texture = tloader.load('img/wall.jpg')
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(width / 5, 1)
    texture.anisotropy = 16


    //mur droite
    const boxWallR = new THREE.Box3();
    const wall_material = new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide})
    let wall = new THREE.Mesh(new THREE.PlaneBufferGeometry(length, height), wall_material)
    wall.position.set(
        x + (width / 2),
        height / 2,
        z + (length / 2)
    )
    wall.rotateY(Math.PI / 2)
    scene.add(wall)
    boxWallR.setFromObject(wall)
    boundingBoxes.push(boxWallR)



    //mur fond
    if (isOpenedAtZend) {
        //cr??ation de deux demi murs (gauche et droite du couloir)
        const boxHalfWall1 = new THREE.Box3();
        wall = new THREE.Mesh(new THREE.PlaneBufferGeometry((width / 2) - couloirWidth, height), wall_material)
        wall.position.set(
            x - couloirWidth - ((width / 2) - couloirWidth) / 2,
            height / 2,
            z + length
        )
        scene.add(wall)
        boxHalfWall1.setFromObject(wall)
        boundingBoxes.push(boxHalfWall1)

        const boxHalfWall2 = new THREE.Box3();
        wall = new THREE.Mesh(new THREE.PlaneBufferGeometry((width / 2) - couloirWidth, height), wall_material)
        wall.position.set(
            x + couloirWidth + ((width / 2) - couloirWidth) / 2,
            height / 2,
            z + length
        )
        scene.add(wall)
        boxHalfWall2.setFromObject(wall)
        boundingBoxes.push(boxHalfWall2)
    } else {
        const boxWallF = new THREE.Box3()
        wall = new THREE.Mesh(new THREE.PlaneBufferGeometry( width, height), wall_material)
        wall.position.set(
            0,
            height / 2,
            z + (length / 2) * 2
        )
        scene.add(wall)
        boxWallF.setFromObject(wall)
        boundingBoxes.push(boxWallF)
    }

    //mur gauche
    const boxWallL = new THREE.Box3()
    wall = new THREE.Mesh(new THREE.PlaneBufferGeometry(length, height), wall_material)
    wall.position.set(
        x + (width / 2) * -1,
        height / 2,
        z + (length / 2)
    )
    wall.rotateY(-Math.PI / 2)
    scene.add(wall)
    boxWallL.setFromObject(wall)
    boundingBoxes.push(boxWallL)

    //mur derriere
    if (isOpenedAtZstart) {
        const boxHalfWall3 = new THREE.Box3();
        wall = new THREE.Mesh(new THREE.PlaneBufferGeometry((width / 2) - couloirWidth, height), wall_material)
        wall.position.set(
            x - couloirWidth - ((width / 2) - couloirWidth) / 2,
            height / 2,
            z
        )
        scene.add(wall)
        boxHalfWall3.setFromObject(wall)
        boundingBoxes.push(boxHalfWall3)

        const boxHalfWall4 = new THREE.Box3();
        wall = new THREE.Mesh(new THREE.PlaneBufferGeometry((width / 2) - couloirWidth, height), wall_material)
        wall.position.set(
            x + couloirWidth + ((width / 2) - couloirWidth) / 2,
            height / 2,
            z
        )
        scene.add(wall)
        boxHalfWall4.setFromObject(wall)
        boundingBoxes.push(boxHalfWall4)
    } else {
        const boxWallB = new THREE.Box3();
        wall = new THREE.Mesh(new THREE.PlaneBufferGeometry(width, height), wall_material)
        wall.position.set(
            0,
            height / 2,
            z
        )
        scene.add(wall)
        boxWallB.setFromObject(wall)
        boundingBoxes.push(boxWallB)
    }
}

/**
 * Permet de cr??er un couloir pour joindre 2 pi??ces
 * @param x x de d??part du couloir
 * @param z z de d??part du couloir
 */
function createCouloir(x, z) {
    const coulSolText = tloader.load('img/parquet.jpg')

    coulSolText.wrapS = coulSolText.wrapT = THREE.RepeatWrapping
    coulSolText.repeat.set(couloirWidth / 2, couloirlenght / 2)
    coulSolText.anisotropy = 16


    const sol_material = new THREE.MeshLambertMaterial({map: coulSolText})
    const plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(couloirWidth * 2, couloirlenght), sol_material)
    plane.rotateX(-Math.PI / 2)
    plane.position.set(x, 0, z + (couloirlenght / 2))
    scene.add(plane)

    const coultext = tloader.load('img/wall.jpg')

    const wall_material = new THREE.MeshPhongMaterial({map: coultext, side: THREE.DoubleSide})
    let wall = new THREE.Mesh(new THREE.PlaneBufferGeometry(couloirlenght, rooms_height), wall_material)
    wall.position.set(
        x + couloirWidth,
        rooms_height / 2,
        z + (couloirlenght / 2)
    )
    wall.rotateY(Math.PI / 2)
    scene.add(wall)
    const coulBB1 = new THREE.Box3()
    coulBB1.setFromObject(wall)
    boundingBoxes.push(coulBB1)

    wall = new THREE.Mesh(new THREE.PlaneBufferGeometry(couloirlenght, rooms_height), wall_material)
    wall.position.set(
        x - couloirWidth,
        rooms_height / 2,
        z + (couloirlenght / 2)
    )
    wall.rotateY(-Math.PI / 2)
    scene.add(wall)
    const coulBB2 = new THREE.Box3()
    coulBB2.setFromObject(wall)
    boundingBoxes.push(coulBB2)
}

/**
 * Retourne les objets intersectent le rayons ??mis
 * @param controller objet a partir duquel est ??mis le rayon
 * @returns {*[]} liste des objets intersect??s
 */
function getIntersections(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObjects(group.children, false);
}

/**
 * Handler de la touche d'action clavier qui affiche du texte/attache l'objet au controlleur en focntion du type de l'objet
 */
function onEPressed() {
    if(isNotInGame)return
    const controller = camera;
    const intersections = getIntersections(controller);
    if (intersections.length > 0) {
        const intersection = intersections[0];
        const object = intersection.object;
        if (object.name.startsWith("art")) {
            let num = parseInt(object.name.substring(4))
            textsInRoom[num].visible = (textsInRoom[num].visible !== true)
        } else {
            object.material.emissive.b = 1;
            controller.attach(object);
            controller.userData.selected = object;
        }
    }
}

/**
 * D??tache l'objet couramment attach?? au controlleur si il y en a un
 */
function onEReleased() {
    if(isNotInGame)return
    const controller = camera;
    if (controller.userData.selected !== undefined) {
        const object = controller.userData.selected;
        object.material.emissive.b = 0;
        group.attach(object);
        controller.userData.selected = undefined;
    }
}

function cleanIntersected() {
    while ( intersected.length ) {
        const object = intersected.pop();
        object.material.emissive.r = 0;
        object.scale.set(1,1,1)
    }
}

function intersectObjects( controller ) {
    if ( controller.userData.selected !== undefined ) return;
    const line = controller.getObjectByName( 'line' );
    const intersections = getIntersections( controller );
    if ( intersections.length > 0 ) {
        const intersection = intersections[ 0 ];
        const object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push( object );
        line.scale.z = intersection.distance;
    } else {
        line.scale.z = 5;
    }
}

function intersectCamObjects(cam){
    if ( cam.userData.selected !== undefined ) return;
    const intersections = getIntersections( cam );
    if ( intersections.length > 0 ) {
        const intersection = intersections[ 0 ];
        const object = intersection.object;
        object.scale.set(1.1,1.1,1.1)
        intersected.push( object );
    }
}

//Boucle du rafraichissement de la sc??ne
renderer.setAnimationLoop(function () {
    animate();
});

