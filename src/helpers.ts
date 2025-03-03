


/** @param _angle in degrees */
/** @returns angle as number in degrees */
export function wrapAngle(angle: number, _max?: number) {

   let max = _max == null ? 360 : _max;

    while (angle < 0) {
        angle += max;
    }
    while (angle >= max) {
        angle -= max;
    }
    return angle;
};


export function radToDegree(x: number): number{
    let scalar = 180/Math.PI;
    let deg = x * scalar;
    deg = deg > 360 ? deg - 360 : deg;
    return deg
};

export function degreeToRad(x: number): number {
    let scalar = Math.PI/180;
    let rad = x * scalar;
    return rad;
};