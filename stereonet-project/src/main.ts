import './style.css'
// import { setupCounter } from './counter.ts'

import { ThreeContext } from './three';

// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
//   <div>
//     <p class="read-the-docs">
//       wassup
//     </p>
//   </div>
// `

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

const ctx = new ThreeContext();

ctx.init();
ctx.render();
