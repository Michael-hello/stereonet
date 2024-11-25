import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { IFeature } from './view-context';
import { wrapAngle, degreeToRad } from './helpers';


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

    features: THREE.Group;
    radius = 90;

    view: '2D' | '3D' = '3D';
    projection: 'equal-angle' | 'equal-area';

    constructor(){}


    init() {
        //TO DO: remove hard coding of element IDs
        let container = document.getElementById('three') as HTMLDivElement;
        let canvasWidth = container.clientWidth;
        let canvasHeight = container.clientHeight;

        this.camera = new THREE.PerspectiveCamera( 45, canvasWidth / canvasHeight, 1, 10000 );   
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
    
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( canvasWidth, canvasHeight );
        container.appendChild( this.renderer.domElement );

        this.cameraControls = new OrbitControls( this.camera, this.renderer.domElement );
        this.cameraControls.addEventListener( 'change', () => this.cameraChange());
        this.cameraControls.enabled = true;
    
        // document.addEventListener( 'pointermove', this.onPointerMove.bind(this) );
        // document.addEventListener( 'pointerdown', this.onPointerDown.bind(this) );
        // document.addEventListener( 'keydown', this.onDocumentKeyDown.bind(this) );
        // document.addEventListener( 'keyup', this.onDocumentKeyUp.bind(this) );
    
        window.addEventListener( 'resize', this.onWindowResize.bind(this) ); 

        this.setupStereonet();

        this.features = new THREE.Group();
        this.scene.add(this.features);
        this.updateView();

        this.renderer.setAnimationLoop( this.render.bind(this) );
    };

    public addFeature(feature: IFeature) {

        let azim = -degreeToRad(wrapAngle(feature.strike + 90));
        let dip = degreeToRad(90 - feature.dip);

        if(feature.type == 'plane') {
            //TO DO: clip above stereonet?
            let w = 2 * this.radius;
            const geometry = new THREE.PlaneGeometry( w, w );
            const material = new THREE.MeshBasicMaterial({ color: 'rgb(30, 30, 240)', side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
            const plane = new THREE.Mesh( geometry, material );

            plane.rotateY(azim);
            plane.rotateX(dip);

            this.features.add(plane);
        };

        if( feature.type == 'point' ) {
            let w = this.radius;
            let points = [];
            let material = new THREE.LineBasicMaterial({ color: 'rgb(30, 30, 240)' });
            points.push( new THREE.Vector3(0, w, 0));
            points.push( new THREE.Vector3(0, -w, 0));
            let geometry = new THREE.BufferGeometry().setFromPoints( points );
            let line = new THREE.Line( geometry, material );
            // let azim = wrapAngle(feature.strike);

            line.rotateY(azim);
            line.rotateX(dip);
            this.features.add(line);
        };
    };

    public updateView() {
        if( this.view == '2D' ) {            
            this.cameraControls.enabled = false;
            let h  = (this.radius * 1.1) / Math.atan(degreeToRad(this.camera.fov / 2));
            this.camera.position.set( 0, h, 0 );
            this.camera.lookAt( 0, 0, 0 );
        }else {
            this.cameraControls.enabled = true;
            let h  = 0.75 * (this.radius * 1.1) / Math.atan(degreeToRad(this.camera.fov / 2));
            this.camera.position.set( -h, h, h );
            this.camera.lookAt( 0, 0, 0 );
        }
        this.render();

        //TO DO: add support for different projections
    };

    private cameraChange() {
        // console.log(this.camera.position);
    };

    private setupStereonet() { 
        const phiStart = 0;
        const phiEnd = Math.PI * 2;
        const thetaStart = 0;
        const thetaEnd = Math.PI / 2;
        const radius = this.radius;

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
                // let angle = (Math.PI / 180) * (2* x + 10 * i);
                semi.rotateZ(-Math.PI/2)
                semi.rotateX(Math.PI/2);
                semi.translateY(a < total / 2 ? -r2 : r2);
                this.scene.add(semi);
            };
        };
    }
    
    private onWindowResize() {  
        let container = document.getElementById('three') as HTMLDivElement;
        let canvasWidth = container.clientWidth;
        let canvasHeight = container.clientHeight;

        this.camera.aspect = canvasWidth / canvasHeight;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize( canvasWidth, canvasHeight );    
        this.render();    
    }
    
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
    
    render() {    
        this.renderer.render( this.scene, this.camera );
    }
};





