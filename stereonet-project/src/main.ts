import { EventBus } from './events';
import './style.css'
import { ThreeContext } from './three';
import { ViewContext } from './view-context';


const bus = new EventBus();
const viewCtx = new ViewContext(bus);
const ctx = new ThreeContext();

const button = document.querySelector<HTMLButtonElement>('#addFeature');

viewCtx.init(button);

ctx.init();
ctx.render();

bus.subscribe('new-feature', () => {
    console.log('new feature yoo')
});
