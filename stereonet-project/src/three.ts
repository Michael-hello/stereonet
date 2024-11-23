import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


export class ThreeContext {

    camera: THREE.PerspectiveCamera; 
    cameraControls: OrbitControls;
    scene: THREE.Scene; 
    renderer: THREE.WebGLRenderer;
    plane: THREE.Mesh;
    pointer: THREE.Vector2; 
    raycaster: THREE.Raycaster; 
    isShiftDown = false;

    rollOverMesh: THREE.Mesh; 
    rollOverMaterial: THREE.MeshBasicMaterial;
    cubeGeo: THREE.BoxGeometry; 
    cubeMaterial: THREE.MeshLambertMaterial;

    objects = [];

    constructor(){}


    init() {

        this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.set( 50, 185, 540 );
        this.camera.lookAt( 0, 0, 0 );
    
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xf0f0f0 );
        
        const rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
        this.rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
        this.rollOverMesh = new THREE.Mesh( rollOverGeo, this.rollOverMaterial );
        // this.scene.add( this.rollOverMesh );
    
        this.cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
        this.cubeMaterial = new THREE.MeshLambertMaterial( { color: 'pink', opacity: 0.6 } );
    
        this.scene.add( new THREE.AxesHelper( 50 ) );
        const gridHelper = new THREE.GridHelper( 1000, 20 );
        // this.scene.add( gridHelper );
    
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
    
        const geometry = new THREE.PlaneGeometry( 1000, 1000 );
        geometry.rotateX( - Math.PI / 2 );
    
        this.plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
        this.scene.add( this.plane );    
        this.objects.push( this.plane );
    
        const ambientLight = new THREE.AmbientLight( 0x606060, 3 );
        this.scene.add( ambientLight );
    
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
        directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
        this.scene.add( directionalLight );
    
        let app = document.querySelector<HTMLDivElement>('#app');
        let three = app.querySelector<HTMLDivElement>('#three');
    
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        three.appendChild( this.renderer.domElement );

        this.cameraControls = new OrbitControls( this.camera, this.renderer.domElement );
        // this.cameraControls.addEventListener( 'change', () => console.log(this.camera.position));
        this.cameraControls.enabled = true;
    
        // document.addEventListener( 'pointermove', this.onPointerMove.bind(this) );
        // document.addEventListener( 'pointerdown', this.onPointerDown.bind(this) );
        // document.addEventListener( 'keydown', this.onDocumentKeyDown.bind(this) );
        // document.addEventListener( 'keyup', this.onDocumentKeyUp.bind(this) );
    
        window.addEventListener( 'resize', this.onWindowResize.bind(this) ); 

        this.setupStereonet();

        this.renderer.setAnimationLoop( this.render.bind(this) );
    }

    setupStereonet() { 
        const phiStart = 0;
        const phiEnd = Math.PI * 2;
        const thetaStart = 0;
        const thetaEnd = Math.PI / 2;
        const radius = 90;

        //add sphere
        const geometry = new THREE.SphereGeometry( radius, 320, 160, phiStart, phiEnd, thetaStart, thetaEnd );
        const material = new THREE.MeshBasicMaterial( { color: 0x9900ff, wireframe: false, side:THREE.DoubleSide, opacity: 0.3, transparent: true } );
        const sphere = new THREE.Mesh( geometry, material );
        sphere.rotateX(Math.PI)
        // this.scene.add( sphere );

        const lineMat = new THREE.LineBasicMaterial( { color: new THREE.Color(0.35, 0.35, 0.35) } );
        const thinLineMat = new THREE.LineBasicMaterial( { color: new THREE.Color(0.6, 0.6, 0.6) } );

        //add circle
        let points = [];
        let count = 1000;

        for(let i = 0; i < count; i++) {
            let theta = i * ((2*Math.PI) / count);
            let y =  -radius * Math.cos(theta);
            let x = radius * Math.sin(theta);
            points.push( new THREE.Vector3( x, 0, y ) );
        };

        let lineGeo = new THREE.BufferGeometry().setFromPoints( points );
        let circle = new THREE.Line( lineGeo, lineMat );
        this.scene.add(circle);

        //add semi-circles
        let semiCount = 17;
        let total = (1 + semiCount) * 5;

        for(let i = 0; i <= semiCount; i++) {

            for(let x = 0; x < 5; x++) {
                let points = [];
                let a = (i * 5) + x;

                for(let j = 0; j < count/2; j++) {
                    let theta = j * ((2*Math.PI) / count);
                    let y =  -radius * Math.cos(theta);
                    let x = radius * Math.sin(theta);
                    points.push( new THREE.Vector3( x, 0, y ) );
                };
                let lineGeo = new THREE.BufferGeometry().setFromPoints( points );
                let semi = new THREE.Line( lineGeo, x == 0 ? lineMat : thinLineMat );
                let angle = (Math.PI / 180) * (2* x + 10 * i);
                semi.rotateZ(-angle)
                this.scene.add(semi);
            };
        };

        //add horizontal circles
        for(let i = 0; i <= semiCount; i++) {

            for(let x = 0; x < 5; x++) {
                let points = [];
                let a = (i * 5) + x;
                let topR = Math.abs(a - (total/2))
                let r2 = radius * (1 -  (topR / (total/2)));
                let r = Math.sqrt( Math.pow(radius, 2) - Math.pow(r2, 2) );
                // if(x > 0 && (r2 / r > 0.95)) continue;

                for(let j = 0; j < count/2; j++) {
                    let theta = j * ((2*Math.PI) / count);
                    let y =  -r * Math.cos(theta);
                    let x = r * Math.sin(theta);
                    points.push( new THREE.Vector3( x, 0, y ) );
                };

                let lineGeo = new THREE.BufferGeometry().setFromPoints( points );
                const semi = new THREE.Line( lineGeo, x == 0 ? lineMat : thinLineMat );
                let angle = (Math.PI / 180) * (2* x + 10 * i);
                semi.rotateZ(-Math.PI/2)
                semi.rotateX(Math.PI/2);
                semi.translateY(a < total / 2 ? -r2 : r2);
                
                console.log(r2.toFixed(2), a, r.toFixed(2), total)

                this.scene.add(semi);
            };
        };
    }
    
    onWindowResize() {    
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize( window.innerWidth, window.innerHeight );    
        this.render();    
    }
    
    onPointerMove( event ) {
    
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
    
    onPointerDown( event ) {
    
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
    
    onDocumentKeyDown( event ) {    
        switch ( event.keyCode ) {    
            case 16: this.isShiftDown = true; break;    
        }    
    }
    
    onDocumentKeyUp( event ) {    
        switch ( event.keyCode ) {    
            case 16: this.isShiftDown = false; break;    
        }    
    }
    
    render() {    
        this.renderer.render( this.scene, this.camera );
    }
};





