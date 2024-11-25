import { EventBus } from './events';
import './style.css'
import { ThreeContext } from './three';
import { IFeature, IViewOptions, ViewContext } from './view-context';


const bus = new EventBus();
const viewCtx = new ViewContext(bus);
const threeCtx = new ThreeContext();
const button = document.querySelector<HTMLButtonElement>('#addFeature');
const options: IViewOptions = { view: '2D', projection: 'equal-angle' };

/** setup */
viewCtx.init(button, options);
threeCtx.init(options);
threeCtx.render();

bus.subscribe('new-feature', (x: IFeature) => {
    threeCtx.addFeature(x);
});

bus.subscribe('view-change', (x: IViewOptions) => {
    threeCtx.updateView(x);
});

// adds some example data
threeCtx.addFeature({ type: 'plane', dip: 40, strike: 180 });
threeCtx.addFeature({ type: 'point', dip: 85, strike: 180 });


