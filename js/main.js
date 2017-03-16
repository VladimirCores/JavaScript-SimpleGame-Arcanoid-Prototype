const canvas = document.getElementById("canvas");
const CTX = canvas.getContext("2d");

var WIDTH = window.innerWidth
,   HEIGHT = window.innerHeight;

canvas.width = WIDTH;
canvas.height = HEIGHT;

const RAD2GRAD = 180 / Math.PI;
const GRAD2RAD = Math.PI / 180;

class Entity
{
    constructor(w,h,color)
    {
        this._x = 0;
        this._y = 0;
        this.width = w;
        this.height = h;
        this._color = color;

        this._shape = document.createElement("canvas");
        this._shape.width = this.width;
        this._shape.height = this.height;
    }
    get cache() {
        return this._shape;
    }
    set color(value) {
        this._color = value;
        let cntx = this._shape.getContext("2d");
        cntx.clearRect(0,0,this.width, this.height);
        this.createCache();
    }

    get y() { return this._y; }
    get x() { return this._x; }
    set y(value) { this._y = value; }
    set x(value) { this._x = value; }

    createCache()
    {
        let cntx = this._shape.getContext("2d");
        cntx.fillStyle = this._color;
        cntx.rect(0, 0, this.width, this.height);
        cntx.closePath();
        cntx.fill();
    }
}

class Block extends Entity
{
    constructor(w,h,c,gx,gy,a)
    {
        super(w,h,c,a);
        this.active = a;
        this.gx = gx;
        this.gy = gy;
    }

    createCache(offset)
    {
        let cntx = this._shape.getContext("2d");
        let doubleOffset = offset*2;
        cntx.fillStyle = this._color;
        cntx.rect(offset, offset, this.width -doubleOffset, this.height - doubleOffset);
        cntx.closePath();
        cntx.fill();
    }

    checkBallCollision(ball)
    {
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

class Ball extends Entity
{
    constructor(r,c,accel,angle) {
        super(r, r, c);
        this.accelX = 0;
        this.accelY = 0;
        this._accel = accel;
        this._angle = (angle - 180) * GRAD2RAD;
    }
    get acceleration(){ return this._accel; }
    get angle() { return this._angle * RAD2GRAD + 180; }
    set acceleration(value) {
        this._accel = value;
        this.calculateMovement();
    }
    set angle(value){
        this._angle = (value - 180) * GRAD2RAD;
        this.calculateMovement();
    }
    calculateMovement(accel, angle) {
        accel = accel || this._accel;
        angle = angle || this._angle;
        this.accelX = accel * Math.sin(angle);
        this.accelY = accel * Math.cos(angle);
    }

    move() {
        this._x += this.accelX;
        this._y += this.accelY;
    }
    checkCollision(box)
    {
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
            // this.angle -= 180;
            return result;
        }
        result = bottom < py;
        if(top > py || result) { // TOP || BOTTOM
            this.accelY *= -1;
            // this.angle -= 180;
        }
        return result;
    }
    createCache() {
        let center = Math.floor(this.radius);
        let cntx = this._shape.getContext("2d");
        cntx.fillStyle = this._color;
        cntx.arc(center, center, center, 0, Math.PI * 2, true);
        cntx.closePath();
        cntx.fill();
    }
    get radius() { return this.width * 0.5; }
    get y() { return (this._y - this.radius); }
    get x() { return (this._x - this.radius); }
    set y(value) { this._y = value; }
    set x(value) { this._x = value; }
}

class Bonus extends Ball {

}

const ENTITIES = [];
const GRID = [];

let counter;
let amount;

const LEVEL = {
    rows: 4,
    columns: 4
};

const SCENE_COLLIDER = [0, WIDTH, 0, HEIGHT];

let PAD = new Pad(100, 10, "grey");
let BALL = new Ball(PAD.width * 0.25, "black", 7, Math.floor(Math.random() * 45 - 60));

let isStarted = false;
let blocksCount = 0;

function init()
{
    SCENE_COLLIDER[3] -= PAD.height;

    PAD.createCache();
    BALL.createCache();
    BALL.calculateMovement();

    trace(BALL.acceleration);
    trace(Math.round(BALL.angle));

    restart();

    window.requestAnimationFrame(update);
    window.addEventListener("touchmove", handleMouseMove());
    window.addEventListener("mousemove", handleMouseMove());
}

let entity;
function update()
{
    CTX.clearRect(0, 0, WIDTH, HEIGHT);
    CTX.save();

    if(isStarted)
    {
        BALL.move();
        let ballOutOfPad = PAD.checkBallInside(BALL);
        let ballTouchFloor = BALL.checkCollision(SCENE_COLLIDER);
        if(ballTouchFloor){
            if(ballOutOfPad) restart();
            else changeBallBounceAngle();
        }

        // PAD.x = BALL.x - PAD.width * 0.4;
        // if(PAD.x < 0) PAD.x = 0;
        // else if(PAD.x > (WIDTH - PAD.width)) PAD.x = WIDTH - PAD.width;
    }

    counter = amount;
    while(counter--) {
        entity = ENTITIES[counter];
        if(
            entity instanceof Block
        &&  entity.active
        &&  entity.checkBallCollision(BALL)
        ) {
            ENTITIES.splice(counter, 1);
            amount--;
            blocksCount--;

            if(blocksCount == 0)
            {
                restart();
                break;
            }

            if(entity.gy > 0)
            {
                GRID[entity.gy - 1][entity.gx].active = true;
            }

            let bonus = new Bonus(20 + Math.round(Math.random() * 20), "red", Math.round(2 + Math.random() * 3), -180);
            bonus.x = entity.x + entity.width * 0.5;
            bonus.y = entity.y + entity.height;
            bonus.calculateMovement();
            bonus.createCache();
            ENTITIES.push(bonus);
            amount++;

            continue;
        }

        if(entity instanceof Bonus) {
            entity.move();
            ballOutOfPad = PAD.checkBallInside(entity);
            ballTouchFloor = entity.checkCollision(SCENE_COLLIDER);
            if(ballTouchFloor){
                if(!ballOutOfPad) {
                    PAD.color = utilsGetRandomColor();
                }
                ENTITIES.splice(counter, 1);
                amount--;
            }
        }

        CTX.drawImage(entity.cache, entity.x, entity.y);
    }

    CTX.restore();
    window.requestAnimationFrame(update);
}

function changeBallBounceAngle()
{
    let padX = PAD.x;
    let padW = PAD.width;
    let padCenter = padW * 0.5;
    let ballX = BALL.x - padX;
    let proportion = Math.round((ballX / padCenter) * 100);
    if(proportion > 100) proportion = proportion - 100;
    else proportion = 100 - proportion;

    var direction = Math.sign(BALL.accelX) * -1;
    BALL.angle = (proportion / 100) * 90 * direction;

    // trace(ballX, padCenter, proportion);
}

function restart()
{
    isStarted = false;

    if(ENTITIES.length > 0)
        ENTITIES.splice(0);
    if(GRID.length > 0)
        GRID.splice(0);

    initPosition();
    initBlocksGrid();

    ENTITIES.push(BALL);
    ENTITIES.push(PAD);

    amount = ENTITIES.length;

    window.addEventListener("touchend", handleMouseClick);
    window.addEventListener("click", handleMouseClick);
}

function initBlocksGrid()
{
    const ROWS = LEVEL.rows;
    const COLUMNS = LEVEL.columns;

    let block;

    let bw = WIDTH / COLUMNS;
    let bh = HEIGHT * 0.25 / ROWS;
    let bc = ["#", 0];

    let lastRowIndex = ROWS - 1;
    let isLastRow;
    let posY;
    let level;
    for(let row = 0; row < ROWS; row++) {
        level = [];
        posY = row * bh;
        for(let col = 0; col < COLUMNS; col++) {
            isLastRow = row == lastRowIndex;
            bc[1] = (Math.random()*0xFFFFFF<<0).toString(16);
            block = new Block(bw, bh, bc.join(""), col, row, isLastRow);
            block.x = col * bw;
            block.y = posY;
            block.createCache(BALL.radius * 0.25);
            ENTITIES.push(block);
            level.push(block);
            blocksCount++;
        }
        GRID.push(level);
    }
}

function initPosition()
{
    let padW = PAD.width;
    let padHalf = padW * 0.5;
    PAD.y = HEIGHT - PAD.height;
    PAD.x = Math.random() * (WIDTH - padW);
    BALL.x = PAD.x + padHalf;
    BALL.y = PAD.y - BALL.radius;
}

function handleMouseMove()
{
    let padWidth = PAD.width;
    let padHalfWidth = padWidth * 0.5;
    let limitL = 0;
    let limitR = WIDTH - padWidth;
    return function(e){
        let posX = (e.touches ? e.touches[0] : e).pageX - padHalfWidth;
        if(posX < limitL) posX = limitL;
        else if(posX > limitR) posX = limitR;
        PAD.x = posX;
        if(!isStarted) {
            BALL.x = PAD.x + padHalfWidth;
        }
    }
}

function handleMouseClick(e)
{
    isStarted = true;
    window.removeEventListener("touchend", handleMouseClick);
    window.removeEventListener("click", handleMouseClick);
}

function trace(...params) {
    console.log.apply(null, params);
}

function utilsGetRandomColor() {
   return "#" + (Math.random()*0xFFFFFF<<0).toString(16);
}
