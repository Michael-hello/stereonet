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
threeCtx.addFeature({ type: 'plane', dip: 40, strike: 83 });
threeCtx.addFeature({ type: 'plane', dip: 50, strike: 310 });
threeCtx.addFeature({ type: 'plane', dip: 22, strike: 3 });
threeCtx.addFeature({ type: 'plane', dip: 5, strike: 165 });
threeCtx.addFeature({ type: 'plane', dip: 82, strike: 210 });

threeCtx.addFeature({ type: 'point', dip: 85, strike: 40 });
threeCtx.addFeature({ type: 'point', dip: 65, strike: 180 });
threeCtx.addFeature({ type: 'point', dip: 25, strike: 220 });
threeCtx.addFeature({ type: 'point', dip: 7, strike: 340 });


