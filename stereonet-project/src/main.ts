import { EventBus } from './events';
import './style.css'
import { ThreeContext } from './three';
import { IFeature, ViewContext } from './view-context';


const bus = new EventBus();
const viewCtx = new ViewContext(bus);
const threeCtx = new ThreeContext();

const button = document.querySelector<HTMLButtonElement>('#addFeature');

viewCtx.init(button);

threeCtx.init();
threeCtx.render();

bus.subscribe('new-feature', (x: IFeature) => {
    console.log('new feature yoo', x);
    threeCtx.addFeature(x);
});
