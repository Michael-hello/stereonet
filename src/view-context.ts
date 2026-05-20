import { generateUUID } from "three/src/math/MathUtils.js";
import { EventBus } from "./events";

export class ViewContext implements IViewOptions {

    get view() { return this._view }
    get projection() { return this._projection }

    private _view: '2D' | '3D';
    private _projection: 'equal-angle' | 'equal-area';
    public features: IFeature[] = [];

    constructor(public bus: EventBus) {}

    init(addFeatureBtn: HTMLButtonElement, showModalBtn: HTMLButtonElement, options: IViewOptions) {
        
        addFeatureBtn.addEventListener('click', this.addFeature.bind(this));
        showModalBtn.addEventListener('click', this.showModal.bind(this));

        this._view = options.view;
        this._projection = options.projection;

        const input3D = document.getElementById("3D") as HTMLInputElement;
        const input2D = document.getElementById("2D") as HTMLInputElement;
        const input3D_2 = document.getElementById("3D_2") as HTMLInputElement;
        const input2D_2 = document.getElementById("2D_2") as HTMLInputElement;
        const inputAngle = document.getElementById("angle") as HTMLInputElement;
        const inputArea = document.getElementById("area") as HTMLInputElement;

        input3D.checked = options.view == '3D';
        input2D.checked = options.view == '2D';
        input3D_2.checked = options.view == '3D';
        input2D_2.checked = options.view == '2D';
        inputAngle.checked = options.projection == 'equal-angle';
        inputArea.checked = options.projection == 'equal-area';

        input3D.addEventListener('change', this.radioInputChange.bind(this));
        input2D.addEventListener('change', this.radioInputChange.bind(this));
        input3D_2.addEventListener('change', this.radioInputChange.bind(this));
        input2D_2.addEventListener('change', this.radioInputChange.bind(this));
        inputAngle.addEventListener('change', this.radioInputChange.bind(this));
        inputArea.addEventListener('change', this.radioInputChange.bind(this)); 
    };

    private addFeature() {
        const inputType = document.getElementById("type") as HTMLInputElement;
        const inputDip = document.getElementById("dip") as HTMLInputElement;
        const inputStrike = document.getElementById("strike") as HTMLInputElement;

        let type =  inputType.value;
        let rawDip = inputDip.value;
        let rawStrike = inputStrike.value;

        if(type == null || rawDip == null || rawStrike == null) return;
        if(type == '' || rawDip == '' || rawStrike == '') return;
        if(!(type == 'plane' || type == 'point')) return;

        if(rawDip.length > 2 || rawStrike.length > 3) return;

        let dip = Number(rawDip);
        let strike = Number(rawStrike);

        if( isNaN(strike) || isNaN(dip) ) return;

        while( dip > 90) dip -= 90;
        while( dip < 0 ) dip += 90;
        while( strike > 360 ) strike -= 360;
        while( strike < 0 ) strike += 360;

        let feature: IFeature = { type, dip, strike, id: generateUUID() };
        this.features.push(feature);

        this.bus.publish('new-feature', feature);
    };

    private removeFeature(id: string) : boolean {

      let removed = false;
      let index = this.features.findIndex(x => x.id == id);

      if(index >= 0) {                    
        this.features.splice(index, 1);
        removed = true;
        this.bus.publish('delete-feature', id);
      };

      return removed;
    };

    private showModal() {

        let toCopy = document.getElementById("rowToCopy");
        let span = document.getElementById("closeModal");
        let modal = document.getElementById("myModal");
        modal.style.display = "block";  
        toCopy.style.display = '';          

        span.onclick = () => modal.style.display = "none";

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };

        for(let dip of this.features) {
            /** prevent duplication */
            let ele = document.getElementById(dip.id);
            if(ele != null) continue;

            let copy = toCopy.cloneNode(true) as HTMLElement;
            copy.setAttribute('id', dip.id);

            (copy.childNodes[1] as HTMLSpanElement).textContent = dip.dip.toFixed(0);
            (copy.childNodes[3] as HTMLSpanElement).textContent = dip.strike.toFixed(0);
            (copy.childNodes[5] as HTMLSpanElement).textContent = dip.type;
            (copy.childNodes[7] as HTMLButtonElement).onclick = () => {
                let removed = this.removeFeature(dip.id);
                if(removed) {
                    let ele = document.getElementById(dip.id);
                    ele.style.display = 'none';
                };
            };
            
            toCopy.insertAdjacentElement('beforebegin', copy);
        };

        toCopy.style.display = 'none';        
    };

    private radioInputChange(e: Event){
        console.log(e)
        let target = e.target as HTMLInputElement;
        if( target == null ) return;

        let checked = target. checked;
        let name = target.name;
        let id = target.id;

        if(!(name == 'projection' || target.name == 'view')) return;

        if(name == 'projection' && id == 'angle' && checked) this._projection = 'equal-angle';
        if(name == 'projection' && id == 'area' && checked) this._projection = 'equal-area'
        if(name == 'view' && (id == '3D' || id == '3D_2') && checked) this._view = '3D';
        if(name == 'view' && (id == '2D' || id == '2D_2') && checked) this._view = '2D';

        this.bus.publish('view-change', { view: this.view, projection: this.projection })
    };

};


export interface IFeature {
    id: string; //uuid
    type: 'plane' | 'point';
    dip: number; //degrees
    strike: number; //strike defined by RH rule //degrees
}


export interface IViewOptions {
    readonly view: '2D' | '3D';
    readonly projection: 'equal-angle' | 'equal-area';
}

