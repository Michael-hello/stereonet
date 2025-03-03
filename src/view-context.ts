import { EventBus } from "./events";

export class ViewContext implements IViewOptions {

    get view() { return this._view }
    get projection() { return this._projection }

    private _view: '2D' | '3D';
    private _projection: 'equal-angle' | 'equal-area';
    private features: IFeature[] = [];

    constructor(public bus: EventBus) {}

    init(element: HTMLButtonElement, options: IViewOptions) {
        element.addEventListener('click', this.addFeature.bind(this));
        this._view = options.view;
        this._projection = options.projection;

        const input3D = document.getElementById("3D") as HTMLInputElement;
        const input2D = document.getElementById("2D") as HTMLInputElement;
        const inputAngle = document.getElementById("angle") as HTMLInputElement;
        const inputArea = document.getElementById("area") as HTMLInputElement;

        input3D.checked = options.view == '3D';
        input2D.checked = options.view == '2D';
        inputAngle.checked = options.projection == 'equal-angle';
        inputArea.checked = options.projection == 'equal-area';

        input3D.addEventListener('change', this.radioInputChange.bind(this));
        input2D.addEventListener('change', this.radioInputChange.bind(this));
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

        let dip = Number(rawDip);
        let strike = Number(rawStrike);

        if( isNaN(strike) || isNaN(dip) ) return;

        while( dip > 90) dip -= 90;
        while( dip < 0 ) dip += 90;
        while( strike > 360 ) strike -= 360;
        while( strike < 0 ) strike += 360;

        let feature: IFeature = { type, dip, strike };
        this.features.push(feature);

        this.bus.publish('new-feature', feature);
    };

    private radioInputChange(e: Event){
        let target = e.target as HTMLInputElement;
        if( target == null ) return;

        let checked = target. checked;
        let name = target.name;
        let id = target.id;

        if(!(name == 'projection' || target.name == 'view')) return;

        if(name == 'projection' && id == 'angle' && checked) this._projection = 'equal-angle';
        if(name == 'projection' && id == 'area' && checked) this._projection = 'equal-area'
        if(name == 'view' && id == '3D' && checked) this._view = '3D';
        if(name == 'view' && id == '2D' && checked) this._view = '2D';

        this.bus.publish('view-change', { view: this.view, projection: this.projection })
    };

};


export interface IFeature {
    type: 'plane' | 'point';
    dip: number; //degrees
    strike: number; //strike defined by RH rule //degrees
}


export interface IViewOptions {
    readonly view: '2D' | '3D';
    readonly projection: 'equal-angle' | 'equal-area';
}

