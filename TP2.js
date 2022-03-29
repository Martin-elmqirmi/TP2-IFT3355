/**
*	[El Mqirmi]
*	[Martin]
*	[20150475]
*/

import * as THREE from '../TP2-IFT3355/build/three.module.js';

import Stats from './jsm/libs/stats.module.js';

import {
    ColladaLoader
}
from './jsm/loaders/ColladaLoader.js';

import {
    OrbitControls
}
from './jsm/controls/OrbitControls.js'

//SPECIAL IMPORT
// THREEx.KeyboardState.js keep the current state of the keyboard.
// It is possible to query it at any time. No need of an event.
// This is particularly convenient in loop driven case, like in
// 3D demos or games.
//
// # Usage
//
// **Step 1**: Create the object
//
// ```var keyboard	= new THREEx.KeyboardState();```
//
// **Step 2**: Query the keyboard state
//
// This will return true if shift and A are pressed, false otherwise
//
// ```keyboard.pressed("shift+A")```
//
// **Step 3**: Stop listening to the keyboard
//
// ```keyboard.destroy()```
//
// NOTE: this library may be nice as standaline. independant from three.js
// - rename it keyboardForGame
//
// # Code
//

/** @namespace */
var THREEx = THREEx || {};

/**
 * - NOTE: it would be quite easy to push event-driven too
 *   - microevent.js for events handling
 *   - in this._onkeyChange, generate a string from the DOM event
 *   - use this as event name
 */
THREEx.KeyboardState = function (domElement) {
    this.domElement = domElement || document;
    // to store the current state
    this.keyCodes = {};
    this.modifiers = {};

    // create callback to bind/unbind keyboard events
    var _this = this;
    this._onKeyDown = function (event) {
        _this._onKeyChange(event)
    }
    this._onKeyUp = function (event) {
        _this._onKeyChange(event)
    }

    // bind keyEvents
    this.domElement.addEventListener("keydown", this._onKeyDown, false);
    this.domElement.addEventListener("keyup", this._onKeyUp, false);

    // create callback to bind/unbind window blur event
    this._onBlur = function () {
        for (var prop in _this.keyCodes)
            _this.keyCodes[prop] = false;
        for (var prop in _this.modifiers)
            _this.modifiers[prop] = false;
    }

    // bind window blur
    window.addEventListener("blur", this._onBlur, false);
}

/**
 * To stop listening of the keyboard events
 */
THREEx.KeyboardState.prototype.destroy = function () {
    // unbind keyEvents
    this.domElement.removeEventListener("keydown", this._onKeyDown, false);
    this.domElement.removeEventListener("keyup", this._onKeyUp, false);

    // unbind window blur event
    window.removeEventListener("blur", this._onBlur, false);
}

THREEx.KeyboardState.MODIFIERS = ['shift', 'ctrl', 'alt', 'meta'];
THREEx.KeyboardState.ALIAS = {
    'left': 37,
    'up': 38,
    'right': 39,
    'down': 40,
    'space': 32,
    'pageup': 33,
    'pagedown': 34,
    'tab': 9,
    'escape': 27
};

/**
 * to process the keyboard dom event
 */
THREEx.KeyboardState.prototype._onKeyChange = function (event) {
    // log to debug
    //console.log("onKeyChange", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)

    // update this.keyCodes
    var keyCode = event.keyCode
        var pressed = event.type === 'keydown' ? true : false
        this.keyCodes[keyCode] = pressed
        // update this.modifiers
        this.modifiers['shift'] = event.shiftKey
        this.modifiers['ctrl'] = event.ctrlKey
        this.modifiers['alt'] = event.altKey
        this.modifiers['meta'] = event.metaKey
}

/**
 * query keyboard state to know if a key is pressed of not
 *
 * @param {String} keyDesc the description of the key. format : modifiers+key e.g shift+A
 * @returns {Boolean} true if the key is pressed, false otherwise
 */
THREEx.KeyboardState.prototype.pressed = function (keyDesc) {
    var keys = keyDesc.split("+");
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
            var pressed = false
            if (THREEx.KeyboardState.MODIFIERS.indexOf(key) !== -1) {
                pressed = this.modifiers[key];
            } else if (Object.keys(THREEx.KeyboardState.ALIAS).indexOf(key) != -1) {
                pressed = this.keyCodes[THREEx.KeyboardState.ALIAS[key]];
            } else {
                pressed = this.keyCodes[key.toUpperCase().charCodeAt(0)]
            }
            if (!pressed)
                return false;
    };
    return true;
}

/**
 * return true if an event match a keyDesc
 * @param  {KeyboardEvent} event   keyboard event
 * @param  {String} keyDesc string description of the key
 * @return {Boolean}         true if the event match keyDesc, false otherwise
 */
THREEx.KeyboardState.prototype.eventMatches = function (event, keyDesc) {
    var aliases = THREEx.KeyboardState.ALIAS
        var aliasKeys = Object.keys(aliases)
        var keys = keyDesc.split("+")
        // log to debug
        // console.log("eventMatches", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var pressed = false;
            if (key === 'shift') {
                pressed = (event.shiftKey ? true : false)
            } else if (key === 'ctrl') {
                pressed = (event.ctrlKey ? true : false)
            } else if (key === 'alt') {
                pressed = (event.altKey ? true : false)
            } else if (key === 'meta') {
                pressed = (event.metaKey ? true : false)
            } else if (aliasKeys.indexOf(key) !== -1) {
                pressed = (event.keyCode === aliases[key] ? true : false);
            } else if (event.keyCode === key.toUpperCase().charCodeAt(0)) {
                pressed = true;
            }
            if (!pressed)
                return false;
        }
        return true;
}

let container, stats, clock, controls;
let lights, camera, scene, renderer, human, humanGeometry, humanMaterial, humanMesh, robot;
let skinWeight, skinIndices, boneArray, realBones, boneDict, centerOfMass;

THREE.Cache.enabled = true;


THREE.Object3D.prototype.setMatrix = function (a) {
    this.matrix = a;
    this.matrix.decompose(this.position, this.quaternion, this.scale);
};


class Robot {
    constructor(h) {
        this.spineLength = 0.65305 ;
		this.chestLength =0.46487;
		this.neckLength = 0.24523
		this.headLength = 0.39284;
		
		this.armLength = 0.72111;
		this.forearmLength = 0.61242;
		this.legLength = 1.16245;
		this.shinLength = 1.03432;
		
		this.armLeftRotation = realBones[4].rotation;
		this.forearmLeftRotation = realBones[5].rotation;
		this.armRightRotation  = realBones[6].rotation;
		this.forearmRightRotation = realBones[7].rotation;
		
		this.legLeftRotation = realBones[8].rotation;
		this.shinLeftRotation = realBones[9].rotation;
		this.legRightRotation = realBones[10].rotation;
		this.shinRightRotation = realBones[11].rotation;
		
		this.spineTranslation = realBones[0].position;
		this.chestTranslation = realBones[1].position;
		this.neckTranslation = realBones[2].position;
		this.headTranslation = realBones[3].position;
		this.armLeftTranslation = realBones[4].position;
		this.forearmLeftTranslation =  realBones[5].position;
		this.armRightTranslation  = realBones[6].position;
		this.forearmTranslation = realBones[7].position;
		
		this.legLeftTranslation =  realBones[8].position;
		this.shinLeftTranslation =  realBones[9].position;
		this.legRightTranslation=  realBones[10].position;
		this.shinRightTranslation =  realBones[11].position;
		
		
        this.bodyWidth = 0.2;
        this.bodyDepth = 0.2;

      
        this.neckRadius = 0.1;

        this.headRadius = 0.32;


        this.legRadius = 0.10;
        this.thighRadius = 0.1;
        this.footDepth = 0.4;
        this.footWidth = 0.25;

        this.armRadius = 0.10;

        this.handRadius = 0.1;

        // Material
        this.material = new THREE.MeshNormalMaterial();
        this.human = h;
        // Initial pose
        this.initialize()
    }

    initialize() {
      // Spine geomerty
        var spineGeometry = new THREE.CylinderGeometry(0.5*this.bodyWidth / 2, this.bodyWidth / 2,this.spineLength, 64);
        if (!this.hasOwnProperty("spine"))
            this.spine = new THREE.Mesh(spineGeometry, this.material);
		
		var chestGeometry = new THREE.CylinderGeometry(0.5*this.bodyWidth / 2, this.bodyWidth / 2, this.chestLength, 64);
		 if (!this.hasOwnProperty("chest"))
            this.chest = new THREE.Mesh(chestGeometry, this.material);
		
        // Neck geomerty
        var neckGeometry = new THREE.CylinderGeometry(0.5*this.neckRadius, this.neckRadius, this.neckLength, 64);
        if (!this.hasOwnProperty("neck"))
            this.neck = new THREE.Mesh(neckGeometry, this.material);

        // Head geomerty
        var headGeometry = new THREE.SphereGeometry(this.headLength/2, 64, 10);
        if (!this.hasOwnProperty("head"))
            this.head = new THREE.Mesh(headGeometry, this.material);

        // Arm right geometry
        var arm_rGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.armLength, 64);
        if (!this.hasOwnProperty("arm_r"))
            this.arm_r = new THREE.Mesh(arm_rGeometry, this.material);

        // Forearm right geometry
        var forearm_rGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.forearmLength, 64);
        if (!this.hasOwnProperty("forearm_r"))
            this.forearm_r = new THREE.Mesh(forearm_rGeometry, this.material);

        // hand left geometry
        var hand_rGeometry = new THREE.SphereGeometry(this.handRadius, 64, 10);
        if (!this.hasOwnProperty("hand_r"))
            this.hand_r = new THREE.Mesh(hand_rGeometry, this.material);

        // Arm left geometry
        var arm_lGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.armLength, 64);
        if (!this.hasOwnProperty("arm_l"))
            this.arm_l = new THREE.Mesh(arm_lGeometry, this.material);

        // Forearm left geometry
        var forearm_lGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.forearmLength, 64);
        if (!this.hasOwnProperty("forearm_l"))
            this.forearm_l = new THREE.Mesh(forearm_lGeometry, this.material);

        // hand left geometry
        var hand_lGeometry = new THREE.SphereGeometry(this.handRadius, 64, 10);
        if (!this.hasOwnProperty("hand_l"))
            this.hand_l = new THREE.Mesh(hand_lGeometry, this.material);

        // leg right geometry
        var leg_rGeometry = new THREE.CylinderGeometry(0.5*this.legRadius, this.legRadius, this.legLength, 64);
        if (!this.hasOwnProperty("leg_r"))
            this.leg_r = new THREE.Mesh(leg_rGeometry, this.material);

        // shin right geometry
        var shin_rGeometry = new THREE.CylinderGeometry(0.5*this.thighRadius, this.thighRadius, this.shinLength, 64);
        if (!this.hasOwnProperty("shin_r"))
            this.shin_r = new THREE.Mesh(shin_rGeometry, this.material);

        // foot right geometry
        var foot_rGeometry = new THREE.BoxGeometry(this.footWidth, 0.2, this.footDepth, 64);
        if (!this.hasOwnProperty("foot_r"))
            this.foot_r = new THREE.Mesh(foot_rGeometry, this.material);

        // leg left geometry
        var leg_lGeometry = new THREE.CylinderGeometry(0.5*this.legRadius, this.legRadius, this.legLength, 64);
        if (!this.hasOwnProperty("leg_l"))
            this.leg_l = new THREE.Mesh(leg_lGeometry, this.material);

        // shin left geometry
        var shin_lGeometry = new THREE.CylinderGeometry(0.5*this.thighRadius, this.thighRadius, this.shinLength, 64);
        if (!this.hasOwnProperty("shin_l"))
            this.shin_l = new THREE.Mesh(shin_lGeometry, this.material);

        // foot left geometry
        var foot_lGeometry = new THREE.BoxGeometry(this.footWidth, 0.2, this.footDepth, 64);
        if (!this.hasOwnProperty("foot_l"))
            this.foot_l = new THREE.Mesh(foot_lGeometry, this.material);

        // Spine matrix
        this.spineMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.spineTranslation.y+this.spineLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);

		this.chestMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.chestTranslation.y-this.spineLength/2+this.chestLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
		var chestMatrix =  matMul(this.spineMatrix, this.chestMatrix);


        // Neck matrix
        this.neckMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.neckTranslation.y-this.chestLength/2+this.neckLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        var neckMatrix = matMul(chestMatrix, this.neckMatrix);


        // Head matrix
        this.headMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.headTranslation.y-this.neckLength/2+this.headLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        var headMatrix = matMul(neckMatrix, this.headMatrix);


        // Translation to put the base of the arm at (0, 0, 0)
        var tran_arm_y = translation(0, this.armLength/2, 0);
        var tran_forearm_y = translation(0, this.forearmLength/2, 0);

        // Arm right matrix
        var rotX_arm_r = rotX(this.armRightRotation.x);
        var rotY_arm_r = rotY(this.armRightRotation.y);
        var rotZ_arm_r = rotZ(this.armRightRotation.z);
        var rotation_arm_r = matMul(rotX_arm_r, matMul(rotY_arm_r, rotZ_arm_r));
        var tran_arm_r = translation(this.armRightTranslation.x, this.armRightTranslation.y - this.chestLength/2,
            this.armRightTranslation.z);
        this.arm_rMatrix = matMul(tran_arm_r, matMul(rotation_arm_r, tran_arm_y));
        var arm_rMatrix = matMul(chestMatrix, this.arm_rMatrix);


        // Forearm right matrix
        var rotX_forearm_r = rotX(this.forearmRightRotation.x);
        var rotY_forearm_r = rotY(this.forearmRightRotation.y);
        var rotZ_forearm_r = rotZ(this.forearmRightRotation.z);
        var rotation_forearm_r = matMul(rotX_forearm_r, matMul(rotY_forearm_r, rotZ_forearm_r));
        var tran_forearm_r = translation(this.forearmTranslation.x, this.forearmTranslation.y - this.armLength/2,
            this.forearmTranslation.z)
        this.forearm_rMatrix = matMul(tran_forearm_r, matMul(rotation_forearm_r, tran_forearm_y));
        var forearm_rMatrix = new THREE.Matrix4().multiplyMatrices(arm_rMatrix, this.forearm_rMatrix);

        // hand right matrix
        this.hand_rMatrix = translation(0, this.forearmLength/2+this.handRadius, 0);
        var hand_rMatrix = matMul(forearm_rMatrix, this.hand_rMatrix);


        // Arm left matrix
        var rotX_arm_l = rotX(this.armLeftRotation.x);
        var rotY_arm_l = rotY(this.armLeftRotation.y);
        var rotZ_arm_l = rotZ(this.armLeftRotation.z);
        var rotation_arm_l = matMul(rotX_arm_l, matMul(rotY_arm_l, rotZ_arm_l));
        var tran_arm_l = translation(this.armLeftTranslation.x, this.armLeftTranslation.y - this.chestLength/2,
            this.armLeftTranslation.z)
        this.arm_lMatrix = matMul(tran_arm_l, matMul(rotation_arm_l, tran_arm_y));
        var arm_lMatrix = matMul(chestMatrix, this.arm_lMatrix);


        // Forearm left matrix
        var rotX_forearm_l = rotX(this.forearmLeftRotation.x);
        var rotY_forearm_l = rotY(this.forearmLeftRotation.y);
        var rotZ_forearm_l = rotZ(this.forearmLeftRotation.z);
        var rotation_forearm_l = matMul(rotX_forearm_l, matMul(rotY_forearm_l, rotZ_forearm_l));
        var tran_forearm_l = translation(this.forearmLeftTranslation.x, this.forearmLeftTranslation.y - this.armLength/2,
            this.forearmLeftTranslation.z)
        this.forearm_lMatrix = matMul(tran_forearm_l, matMul(rotation_forearm_l, tran_forearm_y));
        var forearm_lMatrix = matMul(arm_lMatrix, this.forearm_lMatrix);


        // hand left matrix
        this.hand_lMatrix = translation(0, this.handRadius+this.forearmLength/2, 0);
        var hand_lMatrix = matMul(forearm_lMatrix, this.hand_lMatrix);


        // Translation to put the base of the arm at (0, 0, 0)
        var tran_leg_y = translation(0, this.legLength/2, 0);
        var tran_shin_y = translation(0, this.shinLength/2, 0);

        // leg right matrix
        var rotX_leg_r = rotX(this.legRightRotation.x);
        var rotY_leg_r = rotY(this.legRightRotation.y);
        var rotZ_leg_r = rotZ(this.legRightRotation.z);
        var rotation_leg_r = matMul(rotX_leg_r, matMul(rotY_leg_r, rotZ_leg_r));
        var tran_leg_r = translation(this.legRightTranslation.x, this.legRightTranslation.y - this.spineLength/2,
            this.legRightTranslation.z);
        this.leg_rMatrix = matMul(tran_leg_r, matMul(rotation_leg_r, tran_leg_y));
        var leg_rMatrix = matMul(this.spineMatrix, this.leg_rMatrix);


        // shin right matrix
        var rotX_shin_r = rotX(this.shinRightRotation.x);
        var rotY_shin_r = rotY(this.shinRightRotation.y);
        var rotZ_shin_r = rotZ(this.shinRightRotation.z);
        var rotation_shin_r = matMul(rotX_shin_r, matMul(rotY_shin_r, rotZ_shin_r));
        var tran_shin_r = translation(this.shinRightTranslation.x, this.shinRightTranslation.y - this.legLength/2,
            this.shinRightTranslation.z);
        this.shin_rMatrix = matMul(tran_shin_r, matMul(rotation_shin_r, tran_shin_y));
        var shin_rMatrix = matMul(leg_rMatrix, this.shin_rMatrix);


        // foot right matrix
        this.foot_rMatrix = translation(0, this.shinLength/2+0.1, this.footDepth/4);
        var foot_rMatrix = matMul(shin_rMatrix, this.foot_rMatrix);


        /// leg left matrix
        var rotX_leg_l = rotX(this.legLeftRotation.x);
        var rotY_leg_l = rotY(this.legLeftRotation.y);
        var rotZ_leg_l = rotZ(this.legLeftRotation.z);
        var rotation_leg_l = matMul(rotX_leg_l, matMul(rotY_leg_l, rotZ_leg_l));
        var tran_leg_l = translation(this.legLeftTranslation.x, this.legLeftTranslation.y - this.spineLength/2,
            this.legLeftTranslation.z);
        this.leg_lMatrix = matMul(tran_leg_l, matMul(rotation_leg_l, tran_leg_y));
        var leg_lMatrix = matMul(this.spineMatrix, this.leg_lMatrix);


        // shin left matrix
        var rotX_shin_l = rotX(this.shinLeftRotation.x);
        var rotY_shin_l = rotY(this.shinLeftRotation.y);
        var rotZ_shin_l = rotZ(this.shinLeftRotation.z);
        var rotation_shin_l = matMul(rotX_shin_l, matMul(rotY_shin_l, rotZ_shin_l));
        var tran_shin_l = translation(this.shinLeftTranslation.x, this.shinLeftTranslation.y - this.legLength/2,
            this.shinLeftTranslation.z);
        this.shin_lMatrix = matMul(tran_shin_l, matMul(rotation_shin_l, tran_shin_y));
        var shin_lMatrix = matMul(leg_lMatrix, this.shin_lMatrix);


        // foot left matrix
        this.foot_lMatrix = translation(0, this.shinLength/2+0.1, this.footDepth/4);
        var foot_lMatrix = matMul(shin_lMatrix, this.foot_lMatrix);


        // Apply transformation
        this.spine.setMatrix(this.spineMatrix);
        if (scene.getObjectById(this.spine.id) === undefined)
            scene.add(this.spine);
		
		this.chest.setMatrix(chestMatrix);
        if (scene.getObjectById(this.chest.id) === undefined)
            scene.add(this.chest);
		
        this.neck.setMatrix(neckMatrix);
        if (scene.getObjectById(this.neck.id) === undefined)
            scene.add(this.neck);

        this.head.setMatrix(headMatrix);
        if (scene.getObjectById(this.head.id) === undefined)
            scene.add(this.head);

        this.arm_r.setMatrix(arm_rMatrix);
        if (scene.getObjectById(this.arm_r.id) === undefined)
            scene.add(this.arm_r);

        this.forearm_r.setMatrix(forearm_rMatrix);
        if (scene.getObjectById(this.forearm_r.id) === undefined)
            scene.add(this.forearm_r);

        this.hand_r.setMatrix(hand_rMatrix);
        if (scene.getObjectById(this.hand_r.id) === undefined)
            scene.add(this.hand_r);

        this.arm_l.setMatrix(arm_lMatrix);
        if (scene.getObjectById(this.arm_l.id) === undefined)
            scene.add(this.arm_l);

        this.forearm_l.setMatrix(forearm_lMatrix);
        if (scene.getObjectById(this.forearm_l.id) === undefined)
            scene.add(this.forearm_l);

        this.hand_l.setMatrix(hand_lMatrix);
        if (scene.getObjectById(this.hand_l.id) === undefined)
            scene.add(this.hand_l);

        this.leg_r.setMatrix(leg_rMatrix);
        if (scene.getObjectById(this.leg_r.id) === undefined)
            scene.add(this.leg_r);

        this.shin_r.setMatrix(shin_rMatrix);
        if (scene.getObjectById(this.shin_r.id) === undefined)
            scene.add(this.shin_r);

        this.foot_r.setMatrix(foot_rMatrix);
        if (scene.getObjectById(this.foot_r.id) === undefined)
            scene.add(this.foot_r);

        this.leg_l.setMatrix(leg_lMatrix);
        if (scene.getObjectById(this.leg_l.id) === undefined)
            scene.add(this.leg_l);

        this.shin_l.setMatrix(shin_lMatrix);
        if (scene.getObjectById(this.shin_l.id) === undefined)
            scene.add(this.shin_l);

        this.foot_l.setMatrix(foot_lMatrix);
        if (scene.getObjectById(this.foot_l.id) === undefined)
            scene.add(this.foot_l);

        // Creation d'un ballon de foot pour la pose 1
        var ballRadius = 0.2;
        var ballGeometry = new THREE.SphereGeometry(ballRadius, 64, 10);
        if (!this.hasOwnProperty("ball"))
            this.ball = new THREE.Mesh(ballGeometry, this.material);

        var ballMatrix = translation(-0.5, -this.legLength-this.shinLength-ballRadius/2, 0.7);
        this.ball.setMatrix(ballMatrix);
        if (scene.getObjectById(this.ball.id) === undefined)
            scene.add(this.ball);
        this.ball.visible = false;

        // Creation d'un parallélépipède rectangle pour la pose 2
        var rectangleGeometry = new THREE.BoxGeometry(5, 2, 2, 1, 1, 1);
        if (!this.hasOwnProperty("rectangle"))
            this.rectangle = new THREE.Mesh(rectangleGeometry, this.material);

        var rectangleMatrix = translation(-0.6, -this.legLength-0.26, 0);
        this.rectangle.setMatrix(rectangleMatrix);
        if (scene.getObjectById(this.rectangle.id) === undefined)
            scene.add(this.rectangle);
        this.rectangle.visible = false;
    }
    hideRobot() {
        this.spine.visible = false;
        this.chest.visible = false;
        this.neck.visible = false;
        this.head.visible = false;
        this.arm_r.visible = false;
        this.forearm_r.visible = false;
        this.hand_r.visible = false;
        this.arm_l.visible = false;
        this.forearm_l.visible = false;
        this.hand_l.visible = false;
        this.leg_r.visible = false;
        this.shin_r.visible = false;
        this.foot_r.visible = false;
        this.leg_l.visible = false;
        this.shin_l.visible = false;
        this.foot_l.visible = false;
    }
    hideHuman() {
        this.human.visible = false;
    }

    showRobot() {
        this.spine.visible = true;
        this.chest.visible = true;
        this.neck.visible = true;
        this.head.visible = true;
        this.arm_r.visible = true;
        this.forearm_r.visible = true;
        this.hand_r.visible = true;
        this.arm_l.visible = true;
        this.forearm_l.visible = true;
        this.hand_l.visible = true;
        this.leg_r.visible = true;
        this.shin_r.visible = true;
        this.foot_r.visible = true;
        this.leg_l.visible = true;
        this.shin_l.visible = true;
        this.foot_l.visible = true;
    }
    showHuman() {
        this.human.visible = true;
    }
	
	pose1(){
        this.ball.visible = true;
        this.rectangle.visible = false;

        // Translation to put the base of the arm and the forearm at (0, 0, 0) and comeback
        var tran_arm_y_up = translation(0, this.armLength/2, 0);
        var tran_forearm_y_up = translation(0, this.forearmLength/2, 0);
        var tran_arm_y_down = translation(0, -this.armLength/2, 0);
        var tran_forearm_y_down = translation(0, -this.forearmLength/2, 0);

        // Translation to put the base of the leg and the shin at (0, 0, 0) and comeback
        var tran_leg_y_up = translation(0, this.legLength/2, 0);
        var tran_shin_y_up = translation(0, this.shinLength/2, 0);
        var tran_leg_y_down = translation(0, -this.legLength/2, 0);
        var tran_shin_y_down = translation(0, -this.shinLength/2, 0);

        // Mouvement de la colonne
        this.spine.setMatrix(this.spineMatrix);

        // Mouvement de la poitrine
        this.chest.setMatrix(matMul(this.spine.matrix, this.chestMatrix));

        // Mouvement du cou
        this.neck.setMatrix(matMul(this.chest.matrix, this.neckMatrix));

        // Mouvement de la tête
        this.head.setMatrix(matMul(this.neck.matrix, this.headMatrix));

        // Position bras droit
        var rotX_arm_r = rotX(-pi/2);
        var rotY_arm_r = rotY(-pi/2);
        var rotZ_arm_r = rotZ(-pi/5);
        var transformation_arm_r = matMul(tran_arm_y_down, matMul(rotX_arm_r, matMul(rotY_arm_r,
            matMul(rotZ_arm_r, tran_arm_y_up))));
        this.arm_r.setMatrix(matMul(this.chest.matrix, matMul(this.arm_rMatrix, transformation_arm_r)));

        // Position avant bras droit
        var rotZ_forearm_r = rotZ(-pi/4);
        var rotY_forearm_r = rotY(pi/2);
        var transformation_forearm_r = matMul(tran_forearm_y_down, matMul(rotZ_forearm_r,
            matMul(rotY_forearm_r, tran_forearm_y_up)));
        this.forearm_r.setMatrix(matMul(this.arm_r.matrix, matMul(this.forearm_rMatrix, transformation_forearm_r)));

        // Position main droite
        this.hand_r.setMatrix(matMul(this.forearm_r.matrix, this.hand_rMatrix));

        // Position bras gauche
        var rotX_arm_l = rotX(pi/3);
        var rotZ_arm_l = rotZ(pi/5);
        var transformation_arm_l = matMul(tran_arm_y_down, matMul(rotX_arm_l, matMul(rotZ_arm_l, tran_arm_y_up)));
        this.arm_l.setMatrix(matMul(this.chest.matrix, matMul(this.arm_lMatrix, transformation_arm_l)));

        // Position avant bras droit
        var rotX_forearm_l = rotZ(-pi/8);
        var transformation_forearm_l = matMul(tran_forearm_y_down, matMul(rotX_forearm_l, tran_forearm_y_up));
        this.forearm_l.setMatrix(matMul(this.arm_l.matrix, matMul(this.forearm_lMatrix, transformation_forearm_l)));

        // Position main droite
        this.hand_l.setMatrix(matMul(this.forearm_l.matrix, this.hand_lMatrix));

        // Position jambe droite
        var rotX_leg_r = rotX(-pi/4);
        var transformation_leg_r = matMul(tran_leg_y_down, matMul(rotX_leg_r, tran_leg_y_up));
        this.leg_r.setMatrix(matMul(this.spine.matrix, matMul(this.leg_rMatrix, transformation_leg_r)));

        // Position tibia droit
        var rotX_shin_r = rotX(-pi/2.5);
        var rotZ_shin_r = rotZ(pi/20);
        var transformation_shin_r = matMul(tran_shin_y_down, matMul(rotX_shin_r, matMul(rotZ_shin_r, tran_shin_y_up)));
        this.shin_r.setMatrix(matMul(this.leg_r.matrix, matMul(this.shin_rMatrix, transformation_shin_r)));

        // Position pied droit
        this.foot_r.setMatrix(matMul(this.shin_r.matrix, this.foot_rMatrix));

        // Position jambe gauche
        var rotX_leg_l = rotX(pi/6);
        var transformation_leg_l = matMul(tran_leg_y_down, matMul(rotX_leg_l, tran_leg_y_up));
        this.leg_l.setMatrix(matMul(this.spine.matrix, matMul(this.leg_lMatrix, transformation_leg_l)));

        // Position tibia gauche
        var rotX_shin_l = rotX(-pi/6);
        var rotZ_shin_l = rotZ(-pi/20);
        var transformation_shin_l = matMul(tran_shin_y_down, matMul(rotX_shin_l, matMul(rotZ_shin_l, tran_shin_y_up)));
        this.shin_l.setMatrix(matMul(this.leg_l.matrix, matMul(this.shin_lMatrix, transformation_shin_l)));

        // Position pied gauche
        this.foot_l.setMatrix(matMul(this.shin_l.matrix, this.foot_lMatrix));

        // On ajoute le maillage
        this.addMaillage();
    }
	
	pose2(){
        this.rectangle.visible = true;
        this.ball.visible = false;

        // Translation to put the base of the arm and the forearm at (0, 0, 0) and comeback
        var tran_arm_y_up = translation(0, this.armLength/2, 0);
        var tran_forearm_y_up = translation(0, this.forearmLength/2, 0);
        var tran_arm_y_down = translation(0, -this.armLength/2, 0);
        var tran_forearm_y_down = translation(0, -this.forearmLength/2, 0);

        // Translation to put the base of the leg and the shin at (0, 0, 0) and comeback
        var tran_leg_y_up = translation(0, this.legLength/2, 0);
        var tran_shin_y_up = translation(0, this.shinLength/2, 0);
        var tran_leg_y_down = translation(0, -this.legLength/2, 0);
        var tran_shin_y_down = translation(0, -this.shinLength/2, 0);

        // Mouvement de la colonne
        var rotZ_spine = rotZ(-pi/2.1);
        this.spine.setMatrix(matMul(this.spineMatrix, rotZ_spine));

        // Mouvement de la poitrine
        this.chest.setMatrix(matMul(this.spine.matrix, this.chestMatrix));

        // Mouvement du cou
        this.neck.setMatrix(matMul(this.chest.matrix, this.neckMatrix));

        // Mouvement de la tête
        this.head.setMatrix(matMul(this.neck.matrix, this.headMatrix));

        // Mouvement du bras droit
        this.arm_r.setMatrix(matMul(this.chest.matrix,this.arm_rMatrix));

        // Mouvement de l'avant bras droit
        var rotZ_forearm_r = rotZ(pi/2);
        var transformation_forearm_r = matMul(tran_forearm_y_down, matMul(rotZ_forearm_r, tran_forearm_y_up));
        this.forearm_r.setMatrix(matMul(this.arm_r.matrix, matMul(this.forearm_rMatrix, transformation_forearm_r)));

        // Mouvement de la main droite
        this.hand_r.setMatrix(matMul(this.forearm_r.matrix, this.hand_rMatrix));

        // Mouvement du bras gauche
        var rotZ_arm_l = rotZ(pi/2);
        var transformation_arm_l = matMul(tran_arm_y_down, matMul(rotZ_arm_l, tran_arm_y_up));
        this.arm_l.setMatrix(matMul(this.chest.matrix, matMul(this.arm_lMatrix, transformation_arm_l)));

        // Mouvement de l'avant bras gauche
        var rotZ_forearm_l = rotZ(pi/1.5);
        var rotY_forearm_l = rotY(-pi/2);
        var transformation_forearm_l = matMul(tran_forearm_y_down, matMul(rotZ_forearm_l,
            matMul(rotY_forearm_l, tran_forearm_y_up)));
        this.forearm_l.setMatrix(matMul(this.arm_l.matrix, matMul(this.forearm_lMatrix, transformation_forearm_l)));

        // Mouvement de la main gauche
        this.hand_l.setMatrix(matMul(this.forearm_l.matrix, this.hand_lMatrix));

        // Mouvement de la jambe droite
        var rotX_leg_r = rotX(pi/10);
        var rotY_leg_r = rotY(pi/2);
        var transformation_leg_r = matMul(tran_leg_y_down, matMul(rotY_leg_r,
            matMul(rotX_leg_r, tran_leg_y_up)));
        this.leg_r.setMatrix(matMul(this.spine.matrix, matMul(this.leg_rMatrix, transformation_leg_r)));

        // Mouvement du tibia droit
        var rotX_shin_r = rotX(-pi/2);
        var transformation_shin_r = matMul(tran_shin_y_down, matMul(rotX_shin_r, tran_shin_y_up));
        this.shin_r.setMatrix(matMul(this.leg_r.matrix, matMul(this.shin_rMatrix, transformation_shin_r)));

        // Mouvement du pied droit
        this.foot_r.setMatrix(matMul(this.shin_r.matrix, this.foot_rMatrix));

        // Mouvement de la jambe gauche
        var rotX_leg_l = rotX(pi/8);
        var transformation_leg_l = matMul(tran_leg_y_down, matMul(rotX_leg_l, tran_leg_y_up));
        this.leg_l.setMatrix(matMul(this.spine.matrix, matMul(this.leg_lMatrix, transformation_leg_l)));

        // Mouvement du tibia gauche
        var rotX_shin_l = rotX(-pi/6);
        var transformation_shin_l = matMul(tran_shin_y_down, matMul(rotX_shin_l, tran_shin_y_up));
        this.shin_l.setMatrix(matMul(this.leg_l.matrix, matMul(this.shin_lMatrix, transformation_shin_l)));

        // Mouvement du pied gauche
        this.foot_l.setMatrix(matMul(this.shin_l.matrix, this.foot_lMatrix));

        // On ajoute le maillage
        this.addMaillage();
	}
	
    animate(t) {
        this.rectangle.visible = false;
        this.ball.visible = false;
        var vitesse = 3;

        // Translation to put the base of the leg at (0, 0, 0) and comeback
        var tran_leg_up = translation(0, this.legLength/2, 0);
        var tran_leg_down = translation(0, - this.legLength/2, 0);

        // Translation to put the base of the shin at (0, 0, 0) and comeback
        var tran_shin_up = translation(0, this.shinLength/2, 0);
        var tran_shin_down = translation(0, - this.shinLength/2, 0);

        // Mouvement de la colonne
        this.spine.setMatrix(this.spineMatrix);

        // Mouvement de la poitrine
        this.chest.setMatrix(matMul(this.spine.matrix, this.chestMatrix));

        // Mouvement du cou
        this.neck.setMatrix(matMul(this.chest.matrix, this.neckMatrix));

        // Mouvement de la tête
        this.head.setMatrix(matMul(this.neck.matrix, this.headMatrix));

        // Mouvement jambe droite
        var rot_leg_r = rotX(sin(t * vitesse));
        var transformation_leg_r = matMul(tran_leg_down, matMul(rot_leg_r, tran_leg_up));
        this.leg_r.setMatrix(matMul(this.spine.matrix, matMul(this.leg_rMatrix, transformation_leg_r)));

        // Mouvement tibia droit
        var rot_shin_r;
        if(-sin(t * vitesse) > 0)
            rot_shin_r = rotX(sin(t * vitesse));
        else
            rot_shin_r = rotX(-sin(t * vitesse));
        var transformation_shin_r = matMul(tran_shin_down, matMul(rot_shin_r, tran_shin_up));
        this.shin_r.setMatrix(matMul(this.leg_r.matrix, matMul(this.shin_rMatrix, transformation_shin_r)));

        // Mouvement pied droit
        this.foot_r.setMatrix(matMul(this.shin_r.matrix, this.foot_rMatrix));

        // Mouvement jambe gauche
        var rot_leg_l = rotX(-sin(t * vitesse));
        var transformation_leg_l = matMul(tran_leg_down, matMul(rot_leg_l, tran_leg_up));
        this.leg_l.setMatrix(matMul(this.spine.matrix, matMul(this.leg_lMatrix, transformation_leg_l)));

        // Mouvement tibia gauche
        var rot_shin_l;
        if(-sin(t * vitesse) > 0)
            rot_shin_l = rotX(sin(t * vitesse));
        else
            rot_shin_l = rotX(-sin(t * vitesse));
        var transformation_shin_l = matMul(tran_shin_down, matMul(rot_shin_l, tran_shin_up));
        this.shin_l.setMatrix(matMul(this.leg_l.matrix, matMul(this.shin_lMatrix, transformation_shin_l)));

        // Mouvement pied gauche
        this.foot_l.setMatrix(matMul(this.shin_l.matrix, this.foot_lMatrix));

        // Translation to put the base of the arm at (0, 0, 0) and comeback
        var tran_arm_up = translation(0, this.armLength/2, 0);
        var tran_arm_down = translation(0, - this.armLength/2, 0);

        // Translation to put the base of the shin at (0, 0, 0) and comeback
        var tran_forearm_up = translation(0, this.forearmLength/2, 0);
        var tran_forearm_down = translation(0, - this.forearmLength/2, 0);

        // Mouvement du bras droit
        var rotZ_arm_r = rotZ(pi/6);
        var rotX_arm_r = rotX(-sin(t * vitesse));
        var transformation_arm_r = matMul(tran_arm_down, matMul(rotX_arm_r, matMul(rotZ_arm_r, tran_arm_up)));
        this.arm_r.setMatrix(matMul(this.chest.matrix, matMul(this.arm_rMatrix, transformation_arm_r)));

        // Mouvement de l'avant bras droit
        var rotX_forearm_r;
        if(-sin(t * vitesse) > 0)
            rotX_forearm_r = rotX(pi/2);
        else
            rotX_forearm_r = rotX(pi/2 - sin(t * vitesse));
        var transformation_forearm_r = matMul(tran_forearm_down, matMul(rotX_forearm_r, tran_forearm_up));
        this.forearm_r.setMatrix(matMul(this.arm_r.matrix, matMul(this.forearm_rMatrix, transformation_forearm_r)));

        // Mouvement de la main droite
        this.hand_r.setMatrix(matMul(this.forearm_r.matrix, this.hand_rMatrix));

        // Mouvement du bras gauche
        var rotZ_arm_l = rotZ(-pi/6);
        var rotX_arm_l = rotX(sin(t * vitesse));
        var transformation_arm_l = matMul(tran_arm_down, matMul(rotX_arm_l, matMul(rotZ_arm_l, tran_arm_up)));
        this.arm_l.setMatrix(matMul(this.chest.matrix, matMul(this.arm_lMatrix, transformation_arm_l)));

        // Mouvement de l'avant bras gauche
        var rotX_forearm_l;
        if(sin(t * vitesse) > 0)
            rotX_forearm_l = rotX(pi/2);
        else
            rotX_forearm_l = rotX(pi/2 + sin(t * vitesse));
        var transformation_forearm_l = matMul(tran_forearm_down, matMul(rotX_forearm_l, tran_forearm_up));
        this.forearm_l.setMatrix(matMul(this.arm_l.matrix, matMul(this.forearm_lMatrix, transformation_forearm_l)));

        // Mouvement de la main gauche
        this.hand_l.setMatrix(matMul(this.forearm_l.matrix, this.hand_lMatrix));

        // On ajoute le maillage
        this.addMaillage();
    }

    // Cette fonction est faites pour ajouter le maillage au personnage
    addMaillage() {
        // Matrice de poses
        var chestMatrix =  matMul(this.spineMatrix, this.chestMatrix);
        var neckMatrix = matMul(chestMatrix, this.neckMatrix);
        var headMatrix = matMul(neckMatrix, this.headMatrix);
        var arm_rMatrix = matMul(chestMatrix, this.arm_rMatrix);
        var forearm_rMatrix = matMul(arm_rMatrix, this.forearm_rMatrix);
        var arm_lMatrix = matMul(chestMatrix, this.arm_lMatrix);
        var forearm_lMatrix = matMul(arm_lMatrix, this.forearm_lMatrix);
        var leg_rMatrix = matMul(this.spineMatrix, this.leg_rMatrix);
        var shin_rMatrix = matMul(leg_rMatrix, this.shin_rMatrix);
        var leg_lMatrix = matMul(this.spineMatrix, this.leg_lMatrix);
        var shin_lMatrix = matMul(leg_lMatrix, this.shin_lMatrix);


        // Matrice de transformation Tj pour le linear blend skinning
        var transformation_bone_spine = matMul(this.spine.matrix, inverseOf(this.spineMatrix));
        var transformation_bone_chest = matMul(this.chest.matrix, inverseOf(chestMatrix));
        var transformation_bone_neck = matMul(this.neck.matrix, inverseOf(neckMatrix));
        var transformation_bone_head = matMul(this.head.matrix, inverseOf(headMatrix));
        var transformation_bone_arm_r = matMul(this.arm_r.matrix, inverseOf(arm_rMatrix));
        var transformation_bone_forearm_r = matMul(this.forearm_r.matrix, inverseOf(forearm_rMatrix));
        var transformation_bone_arm_l = matMul(this.arm_l.matrix, inverseOf(arm_lMatrix));
        var transformation_bone_forearm_l = matMul(this.forearm_l.matrix, inverseOf(forearm_lMatrix));
        var transformation_bone_leg_r = matMul(this.leg_r.matrix, inverseOf(leg_rMatrix));
        var transformation_bone_shin_r = matMul(this.shin_r.matrix, inverseOf(shin_rMatrix));
        var transformation_bone_leg_l = matMul(this.leg_l.matrix, inverseOf(leg_lMatrix));
        var transformation_bone_shin_l = matMul(this.shin_l.matrix, inverseOf(shin_lMatrix));


        // On associe les matrices de transformations au boneDict
        boneDict['Spine'].setMatrix(transformation_bone_spine);
        boneDict['Chest'].setMatrix(transformation_bone_chest);
        boneDict['Neck'].setMatrix(transformation_bone_neck);
        boneDict['Head'].setMatrix(transformation_bone_head);
        boneDict['Arm_L'].setMatrix(transformation_bone_arm_l);
        boneDict['Forearm_L'].setMatrix(transformation_bone_forearm_l);
        boneDict['Arm_R'].setMatrix(transformation_bone_arm_r);
        boneDict['Forearm_R'].setMatrix(transformation_bone_forearm_r);
        boneDict['Leg_L'].setMatrix(transformation_bone_leg_l);
        boneDict['Shin_L'].setMatrix(transformation_bone_shin_l);
        boneDict['Leg_R'].setMatrix(transformation_bone_leg_r);
        boneDict['Shin_R'].setMatrix(transformation_bone_shin_r);

        buildShaderBoneMatrix();
    }
}

var keyboard = new THREEx.KeyboardState();
var channel = 'p';
var pi = Math.PI;

function init() {

    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(8, 10, 8);
    camera.lookAt(0, 3, 0);

    scene = new THREE.Scene();
    scene.add(camera);

    controls = new OrbitControls(camera, container);
    controls.damping = 0.2;

    clock = new THREE.Clock();

    boneDict = {}

    boneArray = new Float32Array(12 * 16);

    humanMaterial = new THREE.ShaderMaterial({
        uniforms: {
            bones: {
                value: boneArray
            }
        }
    });

    const shaderLoader = new THREE.FileLoader();
    shaderLoader.load('glsl/human.vs.glsl',
        function (data) {
        humanMaterial.vertexShader = data;
    })
    shaderLoader.load('glsl/human.fs.glsl',
        function (data) {
        humanMaterial.fragmentShader = data;
    })

    // loading manager

    const loadingManager = new THREE.LoadingManager(function () {
        scene.add(humanMesh);
    });

    // collada
    humanGeometry = new THREE.BufferGeometry();
    const loader = new ColladaLoader(loadingManager);
    loader.load('./model/human.dae', function (collada) {
		skinIndices = collada.library.geometries['human-mesh'].build.triangles.data.attributes.skinIndex.array;
        skinWeight = collada.library.geometries['human-mesh'].build.triangles.data.attributes.skinWeight.array;
		realBones = collada.library.nodes.human.build.skeleton.bones;

        buildSkeleton();
        buildShaderBoneMatrix();
        humanGeometry.setAttribute('position', new THREE.BufferAttribute(collada.library.geometries['human-mesh'].build.triangles.data.attributes.position.array, 3));
        humanGeometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));
        humanGeometry.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndices, 4));
        humanGeometry.setAttribute('normal', new THREE.BufferAttribute(collada.library.geometries['human-mesh'].build.triangles.data.attributes.normal.array, 3));

        humanMesh = new THREE.Mesh(humanGeometry, humanMaterial);
        robot = new Robot(humanMesh);
        robot.hideHuman();
    });

    //

    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 0).normalize();
    scene.add(directionalLight);

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    //

    stats = new Stats();
    container.appendChild(stats.dom);

    //

    window.addEventListener('resize', onWindowResize);
    lights = [];
    lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    lights[1] = new THREE.PointLight(0xffffff, 1, 0);
    lights[2] = new THREE.PointLight(0xffffff, 1, 0);

    lights[0].position.set(0, 200, 0);
    lights[1].position.set(100, 200, 100);
    lights[2].position.set( - 100,  - 200,  - 100);

    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);

    var floorTexture = new THREE.ImageUtils.loadTexture('textures/hardwood2_diffuse.jpg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);

    var floorMaterial = new THREE.MeshBasicMaterial({
        map: floorTexture,
        side: THREE.DoubleSide
    });
    var floorGeometry = new THREE.PlaneBufferGeometry(30, 30);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.y -= 2.5;
    scene.add(floor);

}


function buildSkeleton() {
	boneDict["Spine"] = new THREE.Bone();
	boneDict["Chest"] = new THREE.Bone();
	boneDict["Neck"] = new THREE.Bone();
	boneDict["Head"] = new THREE.Bone();
	boneDict["Arm_L"] = new THREE.Bone();
	boneDict["Forearm_L"] = new THREE.Bone();
	boneDict["Arm_R"] = new THREE.Bone();
	boneDict["Forearm_R"] = new THREE.Bone();
	boneDict["Leg_L"] = new THREE.Bone();
	boneDict["Shin_L"] = new THREE.Bone();
	boneDict["Leg_R"] = new THREE.Bone();
	boneDict["Shin_R"] = new THREE.Bone();
	
    // Initialise les matrices des os dans le système de coordonnées du monde
 	boneDict['Chest'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[1].matrix);
	boneDict['Neck'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[2].matrix);
	boneDict['Head'].matrixWorld = matMul(boneDict['Neck'].matrixWorld, realBones[3].matrix);
	boneDict['Arm_L'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[4].matrix);
	boneDict['Forearm_L'].matrixWorld = matMul(boneDict['Arm_L'].matrixWorld, realBones[5].matrix);
	boneDict['Arm_R'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[6].matrix);
	boneDict['Forearm_R'].matrixWorld = matMul(boneDict['Arm_R'].matrixWorld, realBones[7].matrix);
	boneDict['Leg_L'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[8].matrix);
	boneDict['Shin_L'].matrixWorld = matMul(boneDict['Leg_L'].matrixWorld, realBones[9].matrix);
	boneDict['Leg_R'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[10].matrix);
	boneDict['Shin_R'].matrixWorld = matMul(boneDict['Leg_R'].matrixWorld, realBones[11].matrix);

}

/**
* Fills the Float32Array boneArray with the bone matrices to be passed to
* the vertex shader
*/
function buildShaderBoneMatrix() {
    var c = 0;
    for (var key in boneDict) {
        for (var i = 0; i < 16; i++) {
            boneArray[c++] = boneDict[key].matrix.elements[i];
        }
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    checkKeyboard();

    updateBody();
    requestAnimationFrame(animate);
    render();
    stats.update();

}

function render() {

    const delta = clock.getDelta();

    renderer.render(scene, camera);

}

/**
* Returns a new Matrix4 as a multiplcation of m1 and m2
*
* @param {Matrix4} m1 The first matrix
* @param {Matrix4} m2 The second matrix
* @return {Matrix4} m1 x m2
*/
function matMul(m1, m2) {
    return new THREE.Matrix4().multiplyMatrices(m1, m2);
}

/**
* Returns a new Matrix4 as a scalar multiplcation of s and m
*
* @param {number} s The scalar
* @param {Matrix4} m The  matrix
* @return {Matrix4} s * m2
*/
function scalarMul(s, m) {
    var r = m;
    return r.multiplyScalar(s)
}

/**
* Returns an array containing the x,y and z translation component 
* of a transformation matrix
*
* @param {Matrix4} M The transformation matrix
* @return {Array} x,y,z translation components
*/
function getTranslationValues(M) {
    var elems = M.elements;
    return elems.slice(12, 15);
}

/**
* Returns a new Matrix4 as a translation matrix of [x,y,z]
*
* @param {number} x x component
* @param {number} y y component
* @param {number} z z component
* @return {Matrix4} The translation matrix of [x,y,z]
*/
function translation(x, y, z) {
    return new THREE.Matrix4().set(1.0, 0.0, 0.0, x,
                             0.0, 1.0, 0.0, y,
                             0.0, 0.0, 1.0, z,
                             0.0, 0.0, 0.0, 1.0);
}

/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the x-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the x-axis
*/
function rotX(theta) {
    return new THREE.Matrix4().set(1.0, 0.0, 0.0, 0.0,
                             0.0, cos(theta), -sin(theta), 0.0,
                             0.0, sin(theta), cos(theta), 0.0,
                             0.0, 0.0, 0.0, 1.0);
}

/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the y-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the y-axis
*/
function rotY(theta) {
    return new THREE.Matrix4().set(cos(theta), 0.0, sin(theta), 0.0,
                             0.0, 1.0, 0.0, 0.0,
                             -sin(theta), 0.0, cos(theta), 0.0,
                             0.0, 0.0, 0.0, 1.0);
}

/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the z-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the z-axis
*/
function rotZ(theta) {
    return new THREE.Matrix4().set(cos(theta), -sin(theta), 0.0, 0.0,
                             sin(theta), cos(theta), 0.0, 0.0,
                             0.0, 0.0, 1.0, 0.0,
                             0.0, 0.0, 0.0, 1.0);
}

/**
* Returns a new Matrix4 as a scaling matrix with factors of x,y,z
*
* @param {number} x x component
* @param {number} y y component
* @param {number} z z component
* @return {Matrix4} The scaling matrix with factors of x,y,z
*/
function scale(x, y, z) {
    return new THREE.Matrix4().set(x, 0.0, 0.0, 0.0,
                             0.0, y, 0.0, 0.0,
                             0.0, 0.0, z, 0.0,
                             0.0, 0.0, 0.0, 1.0);
}

/**
 * Fonction pour inverser une matrice
 * @param M
 * @returns {*}
 */
function inverseOf(M) {
    var r = M.clone();
    return r.invert();
}

function cos(angle) {
    return Math.cos(angle);
}

function sin(angle) {
    return Math.sin(angle);
}

function checkKeyboard() {
    for (var i = 0; i < 10; i++) {
        if (keyboard.pressed(i.toString())) {
            channel = i;
            break;
        }
    }
}
function updateBody() {

    switch (channel) {
    case 0:
        var t = clock.getElapsedTime();
        robot.animate(t);
        break;

        // add poses here:
    case 1:
        robot.pose1();
        break;

    case 2:
        robot.pose2();
        break;

    case 3:
        break;

    case 4:
        break;

    case 5:
        break;
    case 6:
        robot.hideRobot();
        break;
    case 7:
        robot.showRobot();
        break;
    case 8:
        robot.hideHuman();
        break;
    case 9:
        robot.showHuman();
        break;
    default:
        break;
    }
}

init();
animate();
