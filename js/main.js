
class Entity
{
    constructor(w,h,color)
    {
        this._x = 0;
        this._y = 0;
        this.width = w;
        this.height = h;
        this.color = color;

        this._shape = document.createElement("canvas");
        this._shape.width = this.width;
        this._shape.height = this.height;
    }
    get cache() {
        return this._shape;
    }

    get y() { return this._y; }
    get x() { return this._x; }
    set y(value) { this._y = value; }
    set x(value) { this._x = value; }

    createCache()
    {
        let cntx_d = this._shape.getContext("2d");
        cntx_d.fillStyle = this.color;
        cntx_d.rect(0, 0, this.width, this.height);
        cntx_d.closePath();
        cntx_d.fill();
    }
}

class Block extends Entity
{
    constructor(w,h,c,gx,gy,a){
        super(w,h,c);
        this.gx = gx;
        this.gy = gy;
        this.active = a;
    }

    createCache()
    {
        let cntx_d = this._shape.getContext("2d");
        cntx_d.fillStyle = this.color;
        cntx_d.rect(5, 5, this.width-10, this.height-10);
        cntx_d.closePath();
        cntx_d.fill();
    }
    checkBallCollision(ball) {
        let r = ball.radius;
        let posX = ball.x + r * Math.sign(ball.accelX);
        let posY = ball.y - this.height;
        let left = this.x;
        let right = this.x + this.width;
        if(posY < this._y && posX > left && posX < right) {
            ball.accelY *= -1;
            return true;
        }
        return false;
    }
}

class Ball extends Entity
{
    constructor(r,c,ax,ay) {
        super(r, r, c);
        this.accelX = ax;
        this.accelY = ay;
    }
    move() {
        this._x += this.accelX;
        this._y += this.accelY;
    }
    checkCollision(box) {
        const
            px = this._x,
            py = this._y,
            r = this.radius;
        let left = box[0] + r;
        let right = box[1] - r;
        let top = box[2] + r;
        let bottom = box[3] - r;

        let result = false;
        if(left > px || right < px) { // LEFT || RIGHT
            this.accelX *= -1;
            return result;
        }
        result = bottom < py;
        if(top > py || result) { // TOP || BOTTOM
            this.accelY *= -1;
        }
        return result;
    }
    createCache() {
        let center = Math.floor(this.radius);
        let cntx = this._shape.getContext("2d");
        cntx.fillStyle = this.color;
        cntx.arc(center, center, center, 0, Math.PI * 2,true);
        cntx.closePath();
        cntx.fill();
    }
    get radius() {
        return this.width * 0.5;
    }
    get y() { return (this._y - this.radius); }
    get x() { return (this._x - this.radius); }
    set y(value) { this._y = value; }
    set x(value) { this._x = value; }
}

class Pad extends Entity
{
    checkBallInside(ball){
        let r = ball.radius;
        let posX = ball.x;
        let left = this.x;
        let right = this.x + this.width;
        if(posX > left && posX < right) {
            return false;
        } else
        return true;
    }
}

const canvas = document.getElementById('canvas');
const CTX = canvas.getContext('2d');

const ENTITES = [];
const COLORS_ARR = [ "#1788c2","#d4336a","#217533", "#f8b106", "#81ad31", "#1c4263", "#ea1149", "#c3be42", "#d44628", "#d42621","#e9a586"];

const LEVEL = {
    rows: 2,
    columns: 3
};

let GRID = [];

let counter = 0;
let length = 0;

let entity;

let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const SCENE_COLLIDER = [0, WIDTH, 0, HEIGHT];

const PAD = new Pad(WIDTH * 0.2, WIDTH*0.015, "grey");
const BALL = new Ball(PAD.height * 3, "black", -4, -4);

function init()
{
    PAD.createCache();
    BALL.createCache();

    SCENE_COLLIDER[3] -= PAD.height + 1;

    buildLevel();

    window.addEventListener("resize", handleResize());
    window.addEventListener("mousemove", handleMouseMove());
    window.requestAnimationFrame(update);
}

function initPosition() {
    let padHalf = PAD.width * 0.5;
    PAD.y = HEIGHT - PAD.height;
    PAD.x = padHalf + Math.random() * (HEIGHT - padHalf);
    BALL.x = PAD.x + padHalf;
    BALL.y = PAD.y - BALL.radius;
}

function initGrid() {
    const color_count = COLORS_ARR.length;

    let block;
    let blockWidth = WIDTH / LEVEL.columns,
        blockHeight = HEIGHT * 0.25 / LEVEL.rows;

    const ROWS = LEVEL.rows;
    const COLUMNS = LEVEL.columns;
    const ACTIVE_ROW = ROWS - 1;

    GRID = [];

    let rowArray;
    let color, colorIndex;
    for(let row = 0; row < ROWS; row++) {
        rowArray = [];
        for(let col = 0; col < COLUMNS; col++) {
            colorIndex = Math.floor(Math.random() * color_count);
            color = COLORS_ARR[colorIndex];
            block = new Block(
                blockWidth,
                blockHeight,
                color,
                col,
                row,
                row === ACTIVE_ROW
            );
            block.x = blockWidth * col;
            block.y = blockHeight * row;
            block.createCache();
            rowArray.push(block);
            ENTITES.push(block);
        }
        GRID.push(rowArray);
    }
}

function update() {

    CTX.clearRect(0, 0, WIDTH, HEIGHT); // clear canvas
    CTX.save();

    BALL.move();

    if(BALL.checkCollision(SCENE_COLLIDER) && PAD.checkBallInside(BALL)) {
        buildLevel();
    }

    counter = length;
    while (counter--) {
        entity = ENTITES[counter];
        if(entity instanceof Block
            && entity.active
            && entity.checkBallCollision(BALL))
        {
            ENTITES.splice(counter, 1);
            length--;

            console.clear();
            console.log(ENTITES);

            if(length === 2) {
                buildLevel();
                break;
            }
            if(entity.gy > 0) GRID[entity.gy - 1][entity.gx].active = true;
            continue;
        }
        CTX.drawImage(entity.cache, entity.x, entity.y);
    }

    CTX.restore();
    window.requestAnimationFrame(update);
}

function buildLevel() {
    ENTITES.splice(0, length);
    ENTITES.push(BALL);
    ENTITES.push(PAD);
    initPosition();
    initGrid();
    length = ENTITES.length;
}

function handleResize(e){
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    SCENE_COLLIDER[1] = WIDTH;
    SCENE_COLLIDER[3] = HEIGHT - PAD.height;
}
function handleMouseMove() {
    let padWidth = PAD.width;
    let padHalfWidth = padWidth * 0.5;
    let limitL = 0;
    let limitR = WIDTH - padWidth;
    return function(e){
        let posX = e.pageX - padHalfWidth;
        if(posX < limitL) posX = limitL;
        else if(posX > limitR) posX = limitR;
        PAD.x = posX;
    }
}

