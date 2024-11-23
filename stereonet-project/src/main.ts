import './style.css'
import { ThreeContext } from './three';
import { ViewContext } from './view-context';



const viewCtx = new ViewContext();
const ctx = new ThreeContext();

const button = document.querySelector<HTMLButtonElement>('#addFeature');

viewCtx.init(button);
ctx.init();
ctx.render();
