import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { IFeature, IViewOptions } from './view-context';
import { wrapAngle, degreeToRad } from './helpers';
import { OBB } from 'three/examples/jsm/math/OBB.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/Addons.js';

export class ThreeContext implements IViewOptions {

    camera: THREE.PerspectiveCamera; 
    cameraControls: OrbitControls;
    scene: THREE.Scene; 
    scene2D: THREE.Scene; //allows 2D features to render on top
    renderer: THREE.WebGLRenderer;   
    labelRenderer: CSS2DRenderer; 
    raycaster: THREE.Raycaster; 
  
    features3D: THREE.Group;
    features2D: THREE.Group;
    labels: THREE.Object3D;
    radius = 90;
    resolution = 1000;

    features: IFeature[] = [];

    get view() { return this._view }
    get projection() { return this._projection }

    private _view: '2D' | '3D';
    private _projection: 'equal-angle' | 'equal-area';

    constructor(){}

    init(options: IViewOptions) {
        let container = document.getElementById('three') as HTMLDivElement;
        let canvasWidth = container.clientWidth;
        let canvasHeight = container.clientHeight;

        this.camera = new THREE.PerspectiveCamera( 45, canvasWidth / canvasHeight, 1, 10000 );   
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xf0f0f0 );  
        this.scene2D = new THREE.Scene();
 
        // this.scene.add( new THREE.AxesHelper( 50 ) );
        // const gridHelper = new THREE.GridHelper( 1000, 20 );
        // this.scene.add( gridHelper );
    
        this.raycaster = new THREE.Raycaster();
        const ambientLight = new THREE.AmbientLight( 0x606060, 3 );
        this.scene.add( ambientLight );
    
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
        directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
        this.scene.add( directionalLight );

        this.labels = new THREE.Object3D();
        this.scene2D.add(this.labels);
    
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( canvasWidth, canvasHeight );
        this.renderer.autoClear = false;
        this.renderer.localClippingEnabled = true;
        const localPlane = new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0.8 );

        this.renderer.clippingPlanes = [localPlane ];
        container.appendChild( this.renderer.domElement );

        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize( canvasWidth, canvasHeight );
        this.labelRenderer.domElement.style.width = canvasWidth + 'px'
        this.labelRenderer.domElement.style.height = canvasHeight + 'px'
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.userSelect = 'none';
        this.labelRenderer.domElement.style.margin = '0';
        this.labelRenderer.domElement.style.top = '0';
        container.appendChild( this.labelRenderer.domElement );

        this.cameraControls = new OrbitControls( this.camera, this.labelRenderer.domElement );
        this.cameraControls.addEventListener( 'change', () => this.cameraChange());
        this.cameraControls.enabled = true;
    
        window.addEventListener( 'resize', this.onWindowResize.bind(this) ); 

        this.features3D = new THREE.Group();
        this.features2D = new THREE.Group();
        this.setupStereonet();
        this.updateView(options);

        this.renderer.setAnimationLoop( this.render.bind(this) );
    };

    public addFeature(feature: IFeature) {

        this.features.push(feature);
        this.add2DFeature(feature);
        this.add3DFeature(feature);
    };

    private add2DFeature(feature: IFeature) {

        let material = new THREE.LineBasicMaterial({ color: 'rgb(30, 30, 240)', transparent: false });
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
            let w = this.radius / 75;
            let geometry = new THREE.CircleGeometry( w, 32 ); 
            let material = new THREE.MeshBasicMaterial( { color: 'rgb(30, 30, 240)', side: THREE.DoubleSide, transparent: false } ); 
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

            /** this scaling forces all circles to appear the same size regardless of distance from the camera */
            let width = 2 * Math.tan(degreeToRad(this.camera.fov/2)) * ( circle.position.y + this.camera.position.y );
            let width2 = 2 * Math.tan(degreeToRad(this.camera.fov/2)) * ( this.radius + this.camera.position.y );
            let scale = 1 / (width / width2);
            circle.scale.set(scale, scale, 1);

            this.features2D.add(circle);
        };
    };


    private add3DFeature(feature: IFeature) {

        let azim = -degreeToRad(wrapAngle(feature.strike + 90));
        let dip = degreeToRad(90 - feature.dip);

        if(feature.type == 'plane') {
            const geometry = new THREE.CircleGeometry( this.radius, 35 );
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
            points.push( new THREE.Vector3(0, 0, 0));
            points.push( new THREE.Vector3(0, -w, 0));
            let geometry = new THREE.BufferGeometry().setFromPoints( points );
            let line = new THREE.Line( geometry, material );

            line.rotateY(azim);
            line.rotateX(dip);
            this.features3D.add(line);
        };
    };

    //TO DO: add support for different projections
    public updateView(options: IViewOptions) {

        this._view = options.view;
        this._projection = options.projection;

        if( this.view == '2D' ) {            
            this.cameraControls.enabled = false;
            let h  = (this.radius * 1.25) / Math.tan(degreeToRad(this.camera.fov / 2));
            this.camera.position.set( 0, h, 0 );
            this.camera.lookAt( 0, 0, 0 );
            this.scene2D.add(this.features2D);
            this.scene.remove(this.features3D);

        }else if( this.view == '3D' ){
            this.cameraControls.enabled = true;
            let h  = 0.75 * (this.radius * 1.25) / Math.tan(degreeToRad(this.camera.fov / 2));
            this.camera.position.set( -h, h, h );
            this.camera.lookAt( 0, 0, 0 );
            this.scene.add(this.features3D);
            this.scene2D.remove(this.features2D);
        };

        this.updateText();
        this.render();
    };

    private cameraChange() {
    };

    private setupStereonet() { 

        const radius = this.radius;
        const thickLineMat = new THREE.LineBasicMaterial( { color: new THREE.Color(0.1, 0.1, 0.1), transparent: false, linewidth: 10 } );
        const lineMat = new THREE.LineBasicMaterial( { color: new THREE.Color(0.35, 0.35, 0.35), transparent: false } );
        const thinLineMat = new THREE.LineBasicMaterial( { color: new THREE.Color(0.6, 0.6, 0.6), transparent: false } );

        //add semi-circles
        let semiCount = 17;
        let total = (1 + semiCount) * 5;
        let count = this.resolution;

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

        //add main circle
        let points = [];
 
         for(let i = 0; i <= count; i++) {
             let theta = i * ((2*Math.PI) / count);
             let y =  -radius * Math.cos(theta);
             let x = radius * Math.sin(theta);
             points.push( new THREE.Vector3( x, 0, y ) );
         };
 
         let lineGeo = new THREE.BufferGeometry().setFromPoints( points );
         let circle = new THREE.Line( lineGeo, thickLineMat );
         circle.translateY(0.1);
         this.scene.add(circle);       
    };

    private updateText() {

        this.labels.clear();
        
        if(this.view == '3D') return;

        let r = 1.1 * this.radius;
        let text: { text: string, x: number, y: number }[] = [ 
            { text: 'N', x: 0, y: -r }, 
            { text: 'E', x: 1.1*r, y: 0 }, 
            { text: 'S', x: 0, y: r }, 
            { text: 'W', x: -1.1*r, y: 0 } 
        ];

        for(let i = 0; i < text.length; i++) {
            const moonDiv = document.createElement( 'div' );
            moonDiv.textContent = `${text[i].text}`;
            moonDiv.style.fontSize = '20px';
            moonDiv.style.fontWeight = '400';
            moonDiv.style.color = 'black';
            let label = new CSS2DObject( moonDiv );
            let x = text[i].x
            let y = text[i].y;
            label.position.set(x, 0, y);
            this.labels.add(label);
        };
    }
    
    private onWindowResize() {  
        let container = document.getElementById('three') as HTMLDivElement;
        let canvasWidth = container.clientWidth;
        let canvasHeight = container.clientHeight;

        this.camera.aspect = canvasWidth / canvasHeight;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize( canvasWidth, canvasHeight );   
        this.labelRenderer.setSize( canvasWidth, canvasHeight );
 
        this.render();    
    }       
    
    render() {  
        /** below code allows objects inside scene2D to be rendered on top, see:
            https://stackoverflow.com/questions/12666570/how-to-change-the-zorder-of-object-with-threejs */  
        this.renderer.clear();
        this.renderer.render( this.scene, this.camera );
        this.renderer.clearDepth();
        this.renderer.render( this.scene2D, this.camera );

        this.labelRenderer.render(this.scene2D, this.camera);
    };
};





