// 'sourceType: module'

const _shape = document.createElement("canvas");

export default class Entity
{
    constructor(w,h,color)
    {
        this.x = 0;
        this.y = 0;
        this.width = w;
        this.height = h;
        this.color = color;

        _shape.width = this.width;
        _shape.height = this.height;
    }
    get cache() {
        return _shape;
    }

    createCache()
    {
        let cntx_d = _shape.getContext("2d");
        cntx_d.fillStyle = color;
        cntx_d.rect(0, 0, this.window, this.height);
        cntx_d.closePath();
        cntx_d.fill();
    }
}

/**
 * Created by dqvsra on 3/14/17.
 */
