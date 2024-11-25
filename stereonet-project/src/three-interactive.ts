import { ThreeContext } from "./three";
import * as THREE from 'three';


/** 
 * this implements the interactivity code taken from three-js examples
 */
export class ThreeInteractiveContext extends ThreeContext {

    isShiftDown = false;
    plane: THREE.Mesh;
    pointer: THREE.Vector2;       

    rollOverMesh: THREE.Mesh; 
    rollOverMaterial: THREE.MeshBasicMaterial;
    cubeGeo: THREE.BoxGeometry; 
    cubeMaterial: THREE.MeshLambertMaterial;

    objects = [];

    constructor() {
        super();
    };

    init() {
        super.init();

        const rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
        this.rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
        this.rollOverMesh = new THREE.Mesh( rollOverGeo, this.rollOverMaterial );
        this.scene.add( this.rollOverMesh );

        this.cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
        this.cubeMaterial = new THREE.MeshLambertMaterial( { color: 'pink', opacity: 0.6 } );
    
        this.pointer = new THREE.Vector2();
    
        const geometry = new THREE.PlaneGeometry( 1000, 1000 );
        geometry.rotateX( - Math.PI / 2 );
    
        this.plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
        this.scene.add( this.plane );    
        this.objects.push( this.plane );

        document.addEventListener( 'pointermove', this.onPointerMove.bind(this) );
        document.addEventListener( 'pointerdown', this.onPointerDown.bind(this) );
        document.addEventListener( 'keydown', this.onDocumentKeyDown.bind(this) );
        document.addEventListener( 'keyup', this.onDocumentKeyUp.bind(this) );
    };

    private onPointerMove( event ) {
    
        this.pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
    
        this.raycaster.setFromCamera( this.pointer, this.camera );
    
        const intersects = this.raycaster.intersectObjects( this.objects, false );
    
        if ( intersects.length > 0 ) {
    
            const intersect = intersects[ 0 ];
    
            this.rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
            this.rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
    
            this.render();    
        }    
    }
    
    private onPointerDown( event ) {
    
        this.pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
    
        this.raycaster.setFromCamera( this.pointer, this.camera );
    
        const intersects = this.raycaster.intersectObjects( this.objects, false );
    
        if ( intersects.length > 0 ) {
    
            const intersect = intersects[ 0 ];
    
            // delete cube
    
            if ( this.isShiftDown ) {
    
                if ( intersect.object !== this.plane ) {
    
                    this.scene.remove( intersect.object );
    
                    this.objects.splice( this.objects.indexOf( intersect.object ), 1 );    
                }
    
                // create cube
    
            } else {
    
                const voxel = new THREE.Mesh( this.cubeGeo, this.cubeMaterial );
                voxel.position.copy( intersect.point ).add( intersect.face.normal );
                voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
                this.scene.add( voxel );
    
                this.objects.push( voxel );    
            }
    
            this.render();    
        }    
    }
    
    private onDocumentKeyDown( event ) {    
        switch ( event.keyCode ) {    
            case 16: this.isShiftDown = true; break;    
        }    
    }
    
    private onDocumentKeyUp( event ) {    
        switch ( event.keyCode ) {    
            case 16: this.isShiftDown = false; break;    
        }    
    }
}