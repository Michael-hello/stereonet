import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { IFeature } from './view-context';
import { wrapAngle, degreeToRad } from './helpers';
import { OBB } from 'three/examples/jsm/math/OBB.js';

export class ThreeContext {

    camera: THREE.PerspectiveCamera; 
    cameraControls: OrbitControls;
    scene: THREE.Scene; 
    renderer: THREE.WebGLRenderer;    
    raycaster: THREE.Raycaster; 
  
    features3D: THREE.Group;
    features2D: THREE.Group;
    radius = 90;
    resolution = 1000;

    features: IFeature[] = [];

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
 
        this.scene.add( new THREE.AxesHelper( 50 ) );
        // const gridHelper = new THREE.GridHelper( 1000, 20 );
        // this.scene.add( gridHelper );
    
        this.raycaster = new THREE.Raycaster();
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
    
        window.addEventListener( 'resize', this.onWindowResize.bind(this) ); 

        this.setupStereonet();
        this.features3D = new THREE.Group();
        this.features2D = new THREE.Group();
        this.updateView();

        this.renderer.setAnimationLoop( this.render.bind(this) );
    };

    public addFeature(feature: IFeature) {

        this.features.push(feature);
        this.add2DFeature(feature);
        this.add3DFeature(feature);
    };

    private add2DFeature(feature: IFeature) {

        let material = new THREE.LineBasicMaterial({ color: 'rgb(30, 30, 240)' });
        let azim = -degreeToRad(wrapAngle(feature.strike));
        let dip = degreeToRad(feature.dip);

        if(feature.type == 'plane') {

            let count = this.resolution;
            let radius = this.radius;
            let points = [];            

            for(let j = 0; j < count/2; j++) {
                let theta = j * ((2*Math.PI) / count);
                let y =  -radius * Math.cos(theta);
                let x = radius * Math.sin(theta);
                points.push( new THREE.Vector3( x, 0, y ) );
            };
            let lineGeo = new THREE.BufferGeometry().setFromPoints( points );
            let semi = new THREE.Line( lineGeo, material );
            semi.rotateY(azim);
            semi.rotateZ(-dip);
     
            this.features2D.add(semi);
        };

        if( feature.type == 'point' ) {
            let w = this.radius / 50;
            let geometry = new THREE.CircleGeometry( w, 32 ); 
            let material = new THREE.MeshBasicMaterial( { color: 'rgb(30, 30, 240)', side: THREE.DoubleSide } ); 
            let circle = new THREE.Mesh( geometry, material );
            circle.rotateX(Math.PI / 2);

            /** the below line is used to determine the position of the circle geometry 
              - the end point of the line represents where the point should be **/
            let points = [ new THREE.Vector3(0,0,0), new THREE.Vector3(0, -this.radius, 0) ];
            let geometry2 = new THREE.BufferGeometry().setFromPoints(points);
            let line = new THREE.Line( geometry2, material );
            let azim = -degreeToRad(wrapAngle(feature.strike + 90));
            line.rotateY(azim);
            line.rotateX((Math.PI/2) - dip);

            const aabb = new THREE.Box3().setFromObject(line);
            let obb = new OBB();
            obb = obb.fromBox3(aabb);            

            circle.position.set(obb.center.x*2, obb.center.y*2, obb.center.z*2);
            circle.translateZ(-1); //allow circle to sit above stereonet mesh
            this.features2D.add(circle);
        };
    };


    private add3DFeature(feature: IFeature) {

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

            this.features3D.add(plane);
        };

        if( feature.type == 'point' ) {
            let w = this.radius;
            let points = [];
            let material = new THREE.LineBasicMaterial({ color: 'rgb(30, 30, 240)' });
            points.push( new THREE.Vector3(0, w, 0));
            points.push( new THREE.Vector3(0, -w, 0));
            let geometry = new THREE.BufferGeometry().setFromPoints( points );
            let line = new THREE.Line( geometry, material );

            line.rotateY(azim);
            line.rotateX(dip);
            this.features3D.add(line);
        };
    };

    public updateView() {
        //TO DO: add support for different projections

        if( this.view == '2D' ) {            
            this.cameraControls.enabled = false;
            let h  = (this.radius * 1.1) / Math.atan(degreeToRad(this.camera.fov / 2));
            this.camera.position.set( 0, h, 0 );
            this.camera.lookAt( 0, 0, 0 );
            this.scene.add(this.features2D);
            this.scene.remove(this.features3D);

        }else if( this.view == '3D' ){
            this.cameraControls.enabled = true;
            let h  = 0.75 * (this.radius * 1.1) / Math.atan(degreeToRad(this.camera.fov / 2));
            this.camera.position.set( -h, h, h );
            this.camera.lookAt( 0, 0, 0 );
            this.scene.add(this.features3D);
            this.scene.remove(this.features2D);
        }
        this.render();
    };

    private cameraChange() {
    };

    private setupStereonet() { 

        const radius = this.radius;
        const lineMat = new THREE.LineBasicMaterial( { color: new THREE.Color(0.35, 0.35, 0.35) } );
        const thinLineMat = new THREE.LineBasicMaterial( { color: new THREE.Color(0.6, 0.6, 0.6) } );

        //add circle
        let points = [];
        let count = this.resolution;

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

                for(let j = 0; j < count/2; j++) {
                    let theta = j * ((2*Math.PI) / count);
                    let y =  -r * Math.cos(theta);
                    let x = r * Math.sin(theta);
                    points.push( new THREE.Vector3( x, 0, y ) );
                };

                let lineGeo = new THREE.BufferGeometry().setFromPoints( points );
                const semi = new THREE.Line( lineGeo, x == 0 ? lineMat : thinLineMat );
                semi.rotateZ(-Math.PI/2)
                semi.rotateX(Math.PI/2);
                semi.translateY(a < total / 2 ? -r2 : r2);
                this.scene.add(semi);
            };
        };
    };
    
    private onWindowResize() {  
        let container = document.getElementById('three') as HTMLDivElement;
        let canvasWidth = container.clientWidth;
        let canvasHeight = container.clientHeight;

        this.camera.aspect = canvasWidth / canvasHeight;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize( canvasWidth, canvasHeight );    
        this.render();    
    }       
    
    render() {    
        this.renderer.render( this.scene, this.camera );
    };
};





