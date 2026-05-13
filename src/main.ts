import { EventBus } from './events';
import './styles/style.css'
import './styles/modal.css'
import { ThreeContext } from './three';
import { IFeature, IViewOptions, ViewContext } from './view-context';
import { generateUUID } from 'three/src/math/MathUtils.js';

const bus = new EventBus();
const viewCtx = new ViewContext(bus);
const threeCtx = new ThreeContext();
const addFeatBtn = document.querySelector<HTMLButtonElement>('#addFeature');
const showModalBtn = document.querySelector<HTMLButtonElement>('#showTable');
const options: IViewOptions = { view: '2D', projection: 'equal-angle' };

/** setup */
viewCtx.init(addFeatBtn, showModalBtn, options);
threeCtx.init(options);
threeCtx.render();

bus.subscribe('new-feature', (x: IFeature) => {
    threeCtx.addFeature(x);
});

bus.subscribe('delete-feature', (id: string) => {
    threeCtx.removeFeature(id);
});

bus.subscribe('view-change', (x: IViewOptions) => {
    threeCtx.updateView(x);
});


// adds some example data
const examples: IFeature[] = [
    { type: 'plane', dip: 20, strike: 83, id: generateUUID() },
    { type: 'plane', dip: 50, strike: 310, id: generateUUID() },
    { type: 'point', dip: 25, strike: 40, id: generateUUID() },
    { type: 'point', dip: 65, strike: 180, id: generateUUID() }
];

for(let feature of examples) {
    threeCtx.addFeature(feature);
    viewCtx.features.push(feature);
};




