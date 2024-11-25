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
threeCtx.addFeature({ type: 'plane', dip: 20, strike: 83 });
threeCtx.addFeature({ type: 'plane', dip: 50, strike: 310 });

threeCtx.addFeature({ type: 'point', dip: 25, strike: 40 });
threeCtx.addFeature({ type: 'point', dip: 65, strike: 180 });



