let canvas;

let effect;
let blurH;
let blurV;

var fbo;
var effectFbo;
var bhFbo;
var bvFbo;

var charFbos = {};

var cl1, cl2, cl3, cl4;

var mm;
var WW, HH;
var ratio = Math.sqrt(2)*0+1;
//var resx = map(fxrand(), 0, 1,  1000, 1400);
//var resy = Math.round(1580*1000/resx);
var resx, resy;
var resscale = 2400/1400;
if(fxrand() < -.5){
    resx = 1400;
    resy = Math.round(1400/ratio);
}
else{
    resx = Math.round(1400/ratio);
    resy = 1400;
}
//resx=resy=1400;
var res = Math.min(resx, resy);
var zoom = .8;
var globalseed = Math.floor(fxrand()*1000000);

var hasmargin = 1.0 * (fxrand()*100 < 50);
let inconsolata;

var randomtint = [.1, .1, .1]

var pts = [];



var Engine = Matter.Engine,
    Composites = Matter.Composites,
    Common = Matter.Common,
    Constraint = Matter.Constraint,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    Composite = Matter.Composite,
    Bodies = Matter.Bodies;

var engine;
var grounds;
var bodies = [];

function preload() {
    effect = loadShader('assets/shaders/effect.vert', 'assets/shaders/effect.frag');
    blurH = loadShader('assets/shaders/blur.vert', 'assets/shaders/blur.frag');
    blurV = loadShader('assets/shaders/blur.vert', 'assets/shaders/blur.frag');
    inconsolata = loadFont('assets/fonts/couriermb.ttf');
    //inconsolata = loadFont('assets/fonts/helveticaneue/HelveticaNeueBd.ttf');
}

var deadness = map(fxrand(), 0, 1, 3, 16);
var slant = map(fxrand(), 0, 1, 11, 51);

/*function getRandomRYB(p){
    if(!p)
        p = fxrand();
    p = p%1.;
    var cryb = map2(p);
    cryb = saturatecol(cryb, map(fxrand(), 0, 1, -.3, .3));
    cryb = brightencol(cryb, map(fxrand(), 0, 1, -.3, .3));
    return cryb;
}*/

function setup(){
    pixelDensity(2);
    var or = innerWidth/innerHeight;
    var cr = resx / resy;
    var cw, ch;

    if(or > cr){
        ch = innerHeight-100;
        cw = round(ch*cr);
    }
    else{
        cw = innerWidth-100;
        ch = round(cw/cr);
    }

    canvas = createCanvas(cw, ch, WEBGL);
    canvas.id('maincanvas');

    var p5Canvas = document.getElementById("maincanvas");
    var w = document.getElementById("maincanvas").offsetWidth;
    var h = document.getElementById("maincanvas").offsetHeight;
    //p5Canvas.style.height = h-100 + 'px';
    //p5Canvas.style.width = w-100 + 'px';

    vertFunc = 'curveVertex';

    imageMode(CENTER);
    randomSeed(globalseed);
    noiseSeed(globalseed+123.1341);

    print('fxhash:', fxhash);

    //setAttributes('premultipliedAlpha', true);
    //setAttributes('antialias', true);

    //pg = createGraphics(resx, resy, WEBGL);
    //pg.colorMode(RGB, 1);
    //pg.noStroke();
    //curveDetail(44);
    //pg.textFont(inconsolata);
    //ortho(-resx/2, resx/2, -resy/2, resy/2, 0, 4444);
    textFont(inconsolata);
    textAlign(CENTER, CENTER);
    imageMode(CENTER);
    rectMode(CENTER);
    colorMode(RGB, 1);

    //prepareFbos();

    //drawCube(pg);


    //pg.rotateY(accas);
    //mask.rotateY(accas);

    const pd = pixelDensity();
    fbo = new p5Fbo({renderer: canvas, width: resx*pd*resscale, height: resy*pd*resscale});
    effectFbo = new p5Fbo({renderer: canvas, width: resx*pd*resscale, height: resy*pd*resscale});
    bhFbo = new p5Fbo({renderer: canvas, width: resx*pd*resscale, height: resy*pd*resscale});
    bvFbo = new p5Fbo({renderer: canvas, width: resx*pd*resscale, height: resy*pd*resscale});

    
    fbo.begin();    
    ortho(-resx/2*resscale, resx/2*resscale, -resy/2*resscale, resy/2*resscale, 0, 4444);

    initSim();

    fbo.end();
    showall();
    showall();
    fxpreview();

    if(!issim){
        noLoop();
    }
    //frameRate(2);
    //noLoop();

    //prepareAutomata();
}

var engine;
var particles = [];
var grounds = [];
var dis = 12;
var constraints = [];

function initSim(){
    engine = Engine.create()
    //engine.gravity.x = 0;
    engine.gravity.y = .07;


    for(var k = 0; k < 333; k++){
        var x = -k/333*400 + 2*(.4+.6*k/333)*400*power(noise(k*.01), 3);
        var y = -50 - dis*k;
        var r = 3 + 2*power(noise(k*0.03, 3314.113), 3);
        r = 5;
        particles.push(new Particle(x, y, r));
    }

    var bandc = [];
    var bodies = [];
    for(var k = 0; k < particles.length; k++){
        var bodyA = particles[k].body;
        bandc.push(bodyA);
        if(k > 0){
            var bodyB = particles[k - 1].body;
            var constraint1 = Constraint.create({
                pointA: { x: -2, y: 0 },
                bodyA: bodyA,
                pointB: { x: -2, y: 0 },
                bodyB: bodyB,
                length: dis,
                stiffness: .9,
                angularStiffness: .1,
            });
            var constraint2 = Constraint.create({
                pointA: { x: 2, y: 0 },
                bodyA: bodyA,
                pointB: { x: 2, y: 0 },
                bodyB: bodyB,
                length: dis,
                stiffness: .9,
                angularStiffness: .1,
            });

            bandc.push(constraint1);
            //bandc.push(constraint2);
            constraints.push(constraint1);
            //constraints.push(constraint2);
        }
        if(k == 0){
            var constraint = Constraint.create({
                pointA: { x: 0, y: 0 },
                bodyA: bodyA,
                pointB: { x: bodyA.position.x, y: bodyA.position.y },
                length: 0,
            });

            //bandc.push(constraint);
        }
    }

    var zas = fxrand() < 1.5;
    for(var g = 0; g < 5; g++){
        var x = random(-1, 1);
        var ground;
        if(zas) ground = new Ground(x * 300, g * 100, 300, 12, radians(-x * 40 + random(-5, 5)));
        else ground = new Ground(x * 300, -200+g * 80, 300, 12, radians(random(80, 100)));
        grounds.push(ground);
        bandc.push(ground.body);
    }

    var ground = new Ground(0, resy / 2 + 0, resx, 20, 0, false);
    grounds.push(ground);
    bandc.push(ground.body);
    var ground = new Ground(-resx / 2, 0, 20, resy, 0, false);
    //grounds.push(ground);
    //bandc.push(ground.body);
    var ground = new Ground(+resx / 2, 0, 20, resy, 0, false);
    //grounds.push(ground);
    //bandc.push(ground.body);

    //bandc = bodies.concat(constraints)

    Composite.add(engine.world, bandc);

    mouse = Mouse.create(document.getElementById("maincanvas"));
    var mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                // allow bodies on mouse to rotate
                angularStiffness: 0,
                render: {
                    visible: false
                }
            }
        });

    Composite.add(engine.world, mouseConstraint);

}
var mouse;
function runSim() {
    mouse.position = {'x': map(mouseX, 0, width, -resx/2, resx/2), 'y' :map(mouseY, 0, height, -resy/2, resy/2)};
    Engine.update(engine, 1000 / 60);
    mouse.position = { 'x': map(mouseX, 0, width, -resx/2, resx/2), 'y': map(mouseY, 0, height, -resy/2, resy/2) };

}
var vertFunc;

function drawSim() {

    stroke(.1);
    strokeWeight(6);
    noFill();


    if(vertFunc == 'curveVertex'){
        var pts = [];

        for (var k = 0; k < particles.length - 2; k += 2) {

            if (particles[k].body.position.y < -resy/2)
                continue;
            pts.push(
                createVector(
                    particles[k].body.position.x,
                    particles[k].body.position.y,
                )
            );
        }

        var knots = makeknots(pts, 1, true);
        var hobbypts = gethobbypoints(knots, true, 2);
        //drawhobby(knots, false);

        /*beginShape();
        for (var k = 0; k < hobbypts.length; k += 2) {
            vertex(
                hobbypts[k].x,
                hobbypts[k].y,
            );
        }
        endShape();*/


        /*for (var k = 0; k < hobbypts.length - 4 * 2; k += 4) {
            var p1 = hobbypts[k];
            var p2 = hobbypts[k + 4];
            stroke(.65, .3, .0);
            strokeWeight(9);
            line(
                p1.x + -8+16*power(noise(k*0.02), 3),
                p1.y,
                p2.x + -8+16*power(noise((k+4)*0.02), 3),
                p2.y,
            );
            line(
                p1.x,
                p1.y,
                p2.x,
                p2.y,
            );
        }*/

        for (var k = 0; k < hobbypts.length - 4 * 2; k += 4) {
            var p1 = hobbypts[k];
            var p2 = hobbypts[k + 4];
            /*var p3 = hobbypts[k+2*2];
            var v12 = p5.Vector.sub(p2, p1);
            var v23 = p5.Vector.sub(p3, p2);
            v12.normalize();
            v23.normalize();*/
            //stroke(.04 + .2 * power(noise(k * 0.03, frameCount * .08), 6));
            //stroke(...map2(1. * power(noise(k * 0.0008, frameCount * .08*0), 6)));

            //var col = map2((k * .001) % 1.);
            /*var col = map2(1 * power(noise(k * .000084+frameCount*.001, 595.9), 3));
            var col2 = rgb2hsv(...col);
            col2[1] = .6 + .4 * power(noise(k * .003, 228.3), 3);
            col2[2] = .9 + .1 * power(noise(k * .003, 128.5), 3);
            var col3 = hsv2rgb(...col2);
            stroke(...col3);
            stroke(...map2((round(k * .005) / 5.0) % 1.));
            */
            stroke(...map2((k * .001) % 1.));
            stroke(.04 + .12 * power(noise(k * 0.03, frameCount * .08), 6));

            strokeWeight(2 + 5.5 * power(noise(k * 0.03), 3));
            strokeWeight(5 + 7.5 * power(noise(k * 0.03), 3));
            line(
                p1.x,
                p1.y,
                p2.x,
                p2.y,
            );
        }

    }
    else{
        beginShape();
        for (var k = 0; k < particles.length - 1; k += 2) {
            if (particles[k].body.position.y < -resy / 2)
                continue;
            vertex(
                particles[k].body.position.x,
                particles[k].body.position.y,
            );
        }
        endShape();
    }

    /*for (var k = 0; k < particles.length - 1; k++) {
        line(
            particles[k].body.position.x,
            particles[k].body.position.y,
            particles[k + 1].body.position.x,
            particles[k + 1].body.position.y
        );
    }*/

    for (var k = 0; k < particles.length; k++) {
        particles[k].draw();
    }

    for (var k = 0; k < grounds.length; k++) {
        grounds[k].draw();
    }
}

class Particle{
    constructor(x, y, r){
        this.body = Bodies.circle(x, y, r, {});
    }

    draw(){
        noStroke();
        fill(0.9);
        push();
        translate(this.body.position.x, this.body.position.y);
        rotate(this.body.angle);
        //rect(0, 0, .2*8.1*2, .2*8.1*2);

        pop();
    }
}

var shf = .3
class Ground{
    constructor(x, y, w, h, ang, drawable=true) {
        this.seed = random(1000);
        this.w = w;
        this.h = h;
        this.drawable = drawable;
        this.body = Bodies.rectangle(x, y, w, h, {isStatic: true});
        Matter.Body.rotate(this.body, ang);
    }

    draw() {
        if(!this.drawable)
            return;
        //stroke(.1);
        fill(.1);
        fill(...map2((shf+.25 * power(noise(this.seed,82.12), 9))%1));
        fill(...map2(.53))
        if(noise(this.seed) < .5)
            fill(...map2(0))
        fill(.1);

        noStroke();
        push();
        translate(this.body.position.x, this.body.position.y, 3);
        rotate(this.body.angle);
        rect(0, -3, this.w, this.h);
        pop();
    }
}

var issim = true;
var sim;
function draw(){
    if(issim){
        fbo.begin();
        clear();
        ortho(-resx/2*resscale, resx/2*resscale, -resy/2*resscale, resy/2*resscale, 0, 4444);
        push();
        scale(resscale);

        var bgc = map2(.5);
        bgc = brightencol(bgc, -.3);
        bgc = saturatecol(bgc, -.3);
        bgc = [.62, .62, .65]
        bgc = [.42, .42, .45]
        background(...bgc);
        for(var k = 0; k < 10; k++){
            runSim();
        }
        drawSim();

        fill(.9, .2, .1);
        noStroke();
        //rect(mouse.position.x, mouse.position.y, 8, 8);
        pop();

        fbo.end();
        showall();
    }

    //drawAutomata();
    //stepAutomata();

    //drawText();

    //stroke(1,0,0);
    //line(-1000,-1000,1000,1000)
    //line(+1000,-1000,-1000,1000)
    //fbo.end();
    //drawShapes(mask, shapes);
    //drawLines(bgpg, shapes);
    //showall();
    //fbo.draw();
    //fbo.draw();
    //drawPlants(pg);
    //  if(frameCount > 33)
        //noLoop();

}

var an = fxrand() * 3.14159;

function showall(){
    background(1);
    //pg.push();
    //pg.scale(0.8);
    //pg.pop();
    //pg.line(0,0,mouseX-width/2,mouseY-height/2);

    var dir = [cos(an), sin(an)]
    blurH.setUniform('tex0', fbo.getTexture());
    //blurH.setUniform('tex1', mask);
    blurH.setUniform('texelSize', [1.0/resx/resscale, 1.0/resy/resscale]);
    blurH.setUniform('direction', [dir[0], [1]]);
    blurH.setUniform('u_time', frameCount+globalseed*.01);
    blurH.setUniform('amp', .85);
    blurH.setUniform('seed', (globalseed*.12134)%33.+random(.1,11));
    //blurpass1.shader(blurH);
    //blurpass1.quad(-1,-1,1,-1,1,1,-1,1);
    bhFbo.begin();
    clear();
    shader(blurH);
    quad(-1,-1,1,-1,1,1,-1,1);
    bhFbo.end();
    
    blurV.setUniform('tex0', bhFbo.getTexture());
    //blurV.setUniform('tex1', mask);
    blurV.setUniform('texelSize', [1.0/resx/resscale, 1.0/resy/resscale]);
    blurV.setUniform('direction', [-dir[1], dir[0]]);
    blurV.setUniform('u_time', frameCount+globalseed*.01);
    blurV.setUniform('amp', .85);
    blurV.setUniform('seed', (globalseed*.12134)%33.+random(.1,11));
    //blurpass2.shader(blurV);
    //blurpass2.quad(-1,-1,1,-1,1,1,-1,1);
    bvFbo.begin();
    clear();
    shader(blurV);
    quad(-1,-1,1,-1,1,1,-1,1);
    bvFbo.end();

    effect.setUniform('tex0', fbo.getTexture());
    effect.setUniform('tex1', bvFbo.getTexture());
    //effect.setUniform('tex2', blurpass2);
    //effect.setUniform('tex3', bgpg);
    effect.setUniform('u_usemask', 0.);
    effect.setUniform('u_resolution', [resx*resscale, resy*resscale]);
    effect.setUniform('u_mouse',[dir[0], dir[1]]);
    effect.setUniform('u_time', frameCount);
    effect.setUniform('incolor', randomtint);
    effect.setUniform('seed', globalseed+random(.1,11));
    effect.setUniform('noiseamp', mouseX/width*0+1);
    effect.setUniform('hasmargin', hasmargin);
    //effect.setUniform('tintColor', HSVtoRGB(fxrand(), 0.2, 0.95));
    var hue1 = fxrand();
   //effect.setUniform('tintColor', HSVtoRGB(fxrand(),.3,.9));
    //effect.setUniform('tintColor2', HSVtoRGB((hue1+.45+fxrand()*.1)%1,.3,.9));
    effect.setUniform('tintColor', [0.,0.,1.]);
    effect.setUniform('tintColor2', [0.,0.,1.]);

    effectFbo.begin();
    clear();
    shader(effect);
    quad(-1,-1,1,-1,1,1,-1,1);
    effectFbo.end();
    //effectpass.shader(effect);
    //effectpass.quad(-1,-1,1,-1,1,1,-1,1);
  
    // draw the second pass to the screen
    //image(effectpass, 0, 0, mm-18, mm-18);
    var xx = 0;
    //image(pg, 0, 0, mm*resx/resy-xx, mm-xx);
    effectFbo.draw(0, 0, width, height);

}

function windowResized() {
    var or = innerWidth/innerHeight;
    var cr = resx / resy;
    var cw, ch;

    if(or > cr){
        ch = innerHeight-100;
        cw = round(ch*cr);
    }
    else{
        cw = innerWidth-100;
        ch = round(cw/cr);
    }
    resizeCanvas(cw, ch, true);
    
    var p5Canvas = document.getElementById("maincanvas");
    var w = cw;
    var h = ch;
    //p5Canvas.style.height = h-100 + 'px';
    //p5Canvas.style.width = w-100 + 'px';

    showall();
}


function footer(thesymb){
    var symbs = ",*xae";
    symbs = "*xz";
    var symb = symbs[floor(random(symbs.length))];
    if (thesymb)
        symb = thesymb;
    var fu = 15;
    var ddx = resx-fu*2;
    var nnx = round(ddx/12);
    for(var k = 0; k < nnx; k++){
        var x = map(k, 0, nnx-1, -resx/2+fu, resx/2-fu);
        var y = resy/2-fu*1.;
        //text('*', x, +y);
        //text('*', x, -y);
    }

    var ddy = resy-fu*2;
    var nny = round(ddy/12);
    for(var k = 0; k < nny; k++){
        var y = map(k, 0, nny-1, -resy/2+fu, resy/2-fu);
        var x = resx/2-fu*1.;
        //text('*', +x, y);
        //text('*', -x, y);
    }

    var x1 = -resx/2 + fu;
    var y1 = -resy/2 + fu;
    var x2 = +resx/2 - fu;
    var y2 = +resy/2 - fu;

    var det = 12;
    var nn;
    nn = round(dist(x1,y1,x2,y1)/det);
    fill(0.004);
    noStroke();
    push();
    if(symb == '.' || symb == ','){
        translate(0, -det/2);
    }
    for(var kk = 0; kk < nn; kk++){
        var x = map(kk, 0, nn, x1, x2);
        var y = y1;
        text(symb, x, y);
        if(symb!='*') text(symb, x+random(-.5,.5), y+random(-.5,.5));
    }

    nn = round(dist(x2,y1,x2,y2)/det);
    for(var kk = 0; kk < nn; kk++){
        var x = x2;
        var y = map(kk, 0, nn, y1, y2);
        text(symb, x, y);
        if(symb!='*') text(symb, x+random(-.5,.5), y+random(-.5,.5));
    }

    nn = round(dist(x2,y2,x1,y2)/det);
    for(var kk = 0; kk < nn; kk++){
        var x = map(kk, 0, nn, x2, x1);
        var y = y2;
        text(symb, x, y);
        if(symb!='*') text(symb, x+random(-.5,.5), y+random(-.5,.5));
    }

    nn = round(dist(x1,y2,x1,y1)/det);
    for(var kk = 0; kk < nn; kk++){
        var x = x1;
        var y = map(kk, 0, nn, y2, y1);
        text(symb, x, y);
        if(symb!='*') text(symb, x+random(-.5,.5), y+random(-.5,.5));
    }
    pop();
}

function polyToColliders(poly){
    var grounds = [];
    for(var i = 0; i < poly.length-1; i++){
        var p1 = poly[i];
        var p2 = poly[(i+1)%poly.length];

        var mid = p5.Vector.add(p1, p2);
        mid.mult(.5);
        var p12 = p5.Vector.sub(p2, p1);
        var dd = p12.mag();
        var ang = p12.heading();

        var body = Bodies.rectangle(mid.x, mid.y, dd, 20, {isStatic: true, label: "custom", friction: 1,frictionStatic: Infinity});
        Matter.Body.rotate(body, ang);

        grounds.push(body);
    }
    return grounds;
}

var colpolys = [];

function rotateArr(arr, num){
    for(var k = 0; k < num; k++){
        var t = arr.pop();
        arr = [t].concat(arr);
    }
    return arr;
}


var accas = fxrand()*6.28;
var ooo = Math.round(1+3*fxrand());

function max(a, b){
    if(a >= b)
        return a;
    return b;
}

function min(a, b){
    if(a <= b)
        return a;
    return b;
}


function rotateAround(vect, axis, angle) {
    // Make sure our axis is a unit vector
    axis = p5.Vector.normalize(axis);
  
    return p5.Vector.add(
      p5.Vector.mult(vect, cos(angle)),
      p5.Vector.add(
        p5.Vector.mult(
          p5.Vector.cross(axis, vect),
          sin(angle)
        ),
        p5.Vector.mult(
          p5.Vector.mult(
            axis,
            p5.Vector.dot(axis, vect)
          ),
          (1 - cos(angle))
        )
      )
    );
  }



function myline(x1, y1, z1, x2, y2, z2){
    var d = dist(x1,y1,z1,x2,y2,z2);
    var det = 1.5;
    var parts = 2 + round(d/det);
    var amp = 2.;
    var frq = 0.01;
    for(var k = 0; k < parts; k++){
        var p = map(k, 0, parts-1, 0, 1);
        var x = lerp(x1, x2, p);
        var y = lerp(y1, y2, p);
        var z = lerp(z1, z2, p);
        var nx = x + amp*(-.5 + power(noise(x*frq, y*frq, z*frq+311.13), 2));
        var ny = y + amp*(-.5 + power(noise(x*frq, y*frq, z*frq+887.62), 2));
        var rr = map(power(noise(k*0.03, x1+x2), 3), 0, 1, .5, 1.6);
        ellipse(nx, ny, rr, rr);
    }
}

function gethobbypoints(knots, cycle, det=12){
    var hobbypts = [];
    for (var i=0; i<knots.length-1; i++) {
        var p0x = knots[i].x_pt;
        var p1x = knots[i].rx_pt;
        var p2x = knots[(i+1)%knots.length].lx_pt;
        var p3x = knots[(i+1)%knots.length].x_pt;
        var p0y = knots[i].y_pt;
        var p1y = knots[i].ry_pt;
        var p2y = knots[(i+1)%knots.length].ly_pt;
        var p3y = knots[(i+1)%knots.length].y_pt;

        //bezier(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y);

        var steps = 44;
        var totald = 0;
        var algorithm = 0;
        if(algorithm == 0){
            for(var st = 0; st < steps; st++){
                var t = map(st, 0, steps, 0, 1);
                var tn = map(st+1, 0, steps, 0, 1);
                x = (1-t)*(1-t)*(1-t)*p0x + 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t*p3x;
                y = (1-t)*(1-t)*(1-t)*p0y + 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t*p3y;
                
                xn = (1-tn)*(1-tn)*(1-tn)*p0x + 3*(1-tn)*(1-tn)*tn*p1x + 3*(1-tn)*tn*tn*p2x + tn*tn*tn*p3x;
                yn = (1-tn)*(1-tn)*(1-tn)*p0y + 3*(1-tn)*(1-tn)*tn*p1y + 3*(1-tn)*tn*tn*p2y + tn*tn*tn*p3y;
    
                var tonext = dist(xn, yn, x, y);
                totald += tonext;
            }
            steps = 2 + round(totald/det);
    
            for(var st = 0; st < steps; st++){
                var t = map(st, 0, steps, 0, 1);
                x = (1-t)*(1-t)*(1-t)*p0x + 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t*p3x;
                y = (1-t)*(1-t)*(1-t)*p0y + 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t*p3y;
    
                hobbypts.push(createVector(x, y));
            }
        }
        if(algorithm == 1){
            var t = 0;
            var dt = 0.05;
            while(t < 1.-dt/2){
                x = (1-t)*(1-t)*(1-t)*p0x + 3*(1-t)*(1-t)*t*p1x + 3*(1-t)*t*t*p2x + t*t*t*p3x;
                y = (1-t)*(1-t)*(1-t)*p0y + 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t*p3y;
                hobbypts.push(createVector(x, y));
    
                var tn = t + dt;
                xn = (1-tn)*(1-tn)*(1-tn)*p0x + 3*(1-tn)*(1-tn)*tn*p1x + 3*(1-tn)*tn*tn*p2x + tn*tn*tn*p3x;
                yn = (1-tn)*(1-tn)*(1-tn)*p0y + 3*(1-tn)*(1-tn)*tn*p1y + 3*(1-tn)*tn*tn*p2y + tn*tn*tn*p3y;
                var tonext = dist(xn, yn, x, y);
                var offsc = tonext/det;
                dt = dt/offsc;
    
                t = t + dt;
            }
        }
        
    }
    return hobbypts;
}


function map(v, v1, v2, v3, v4){
    return (v-v1)/(v2-v1)*(v4-v3)+v3;
}


function mouseClicked(){
    //createShapes();
}

function keyPressed(){
    //noiseSeed(round(random(1000)));
    //createShapes();
    if(key == 'g'){
        engine.gravity.y = -engine.gravity.y;
    }
    if(key == 'c'){
        if (vertFunc == 'vertex') {
            vertFunc = 'curveVertex';
        }
        else{
            vertFunc = 'vertex';
        }
    }
    if(key == 's'){
        var data = effectFbo.readToPixels();
        var img = createImage(effectFbo.width, effectFbo.height);
        for (i = 0; i < effectFbo.width; i++){
          for (j = 0; j < effectFbo.height; j++){
            var pos = (j * effectFbo.width*4) + i * 4;
            img.set(i,effectFbo.height-1-j, [data[pos], data[pos+1], data[pos+2],255]);
          }
        }
        img.updatePixels();
        img.save('output_' + fxhash, 'png');
    }
}

function rnoise(s, v1, v2){
    return v1 + (v2-v1)*((power(noise(s), 3)*1)%1.0);
}


function power(p, g) {
    if (p < 0.5)
        return 0.5 * Math.pow(2*p, g);
    else
        return 1 - 0.5 * Math.pow(2*(1 - p), g);
}


function drawhobby(knots, cycle=false) {
/*
    for (var i = 0; i < knots.length - 1; i++) {
        push();
        fill(0);
        noStroke();
        translate(knots[i].x_pt, knots[i].y_pt, 0);
        ellipse(0, 0, 5, 5);
        pop();
    }

    var det = 10;
    for (var i = 0; i < knots.length; i++) {
        var p0x = knots[i].x_pt;
        var p1x = knots[i].rx_pt;
        var p2x = knots[(i + 1) % knots.length].lx_pt;
        var p3x = knots[(i + 1) % knots.length].x_pt;
        var p0y = knots[i].y_pt;
        var p1y = knots[i].ry_pt;
        var p2y = knots[(i + 1) % knots.length].ly_pt;
        var p3y = knots[(i + 1) % knots.length].y_pt;

        //bezier(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y);

        var steps = 10;
        var totald = 0;
        for (var st = 0; st < steps; st++) {
            var t = map(st, 0, steps, 0, 1);
            var tn = map(st + 1, 0, steps, 0, 1);
            x = (1 - t) * (1 - t) * (1 - t) * p0x + 3 * (1 - t) * (1 - t) * t * p1x + 3 * (1 - t) * t * t * p2x + t * t * t * p3x;
            y = (1 - t) * (1 - t) * (1 - t) * p0y + 3 * (1 - t) * (1 - t) * t * p1y + 3 * (1 - t) * t * t * p2y + t * t * t * p3y;

            xn = (1 - tn) * (1 - tn) * (1 - tn) * p0x + 3 * (1 - tn) * (1 - tn) * tn * p1x + 3 * (1 - tn) * tn * tn * p2x + tn * tn * tn * p3x;
            yn = (1 - tn) * (1 - tn) * (1 - tn) * p0y + 3 * (1 - tn) * (1 - tn) * tn * p1y + 3 * (1 - tn) * tn * tn * p2y + tn * tn * tn * p3y;

            totald += dist(xn, yn, x, y);
        }
        steps = 2 + round(totald / det);


        for (var st = 0; st < steps; st++) {
            var t = map(st, 0, steps, 0, 1);
            x = (1 - t) * (1 - t) * (1 - t) * p0x + 3 * (1 - t) * (1 - t) * t * p1x + 3 * (1 - t) * t * t * p2x + t * t * t * p3x;
            y = (1 - t) * (1 - t) * (1 - t) * p0y + 3 * (1 - t) * (1 - t) * t * p1y + 3 * (1 - t) * t * t * p2y + t * t * t * p3y;

            push();
            fill(0);
            noStroke();
            translate(x, y, 0);
            ellipse(0, 0, 5, 5);
            pop();
        }
    }
*/

    beginShape();
    vertex(knots[0].x_pt, knots[0].y_pt, 0);
    for (var i = 0; i < knots.length - 1; i++) {
        //   knots[i+1].lx_pt.toFixed(4), knots[i+1].ly_pt.toFixed(4),
        //   knots[i+1].x_pt.toFixed(4), knots[i+1].y_pt.toFixed(4));

        bezierVertex(
            knots[i].rx_pt, knots[i].ry_pt,
            knots[i + 1].lx_pt, knots[i + 1].ly_pt,
            knots[i + 1].x_pt, knots[i + 1].y_pt,
        );

        //push();
        //noStroke();
        //fill(...getRandomColor());
        //ellipse(knots[i].x_pt,  knots[i].y_pt, 3, 3);
        //ellipse(knots[i].rx_pt, knots[i].ry_pt, 1, 1);
        //ellipse(knots[i+1].lx_pt, knots[i+1].ly_pt, 1, 1);
        //ellipse(knots[i+1].x_pt,  knots[i+1].y_pt, 3, 3);
        //pop();
    }
    if (cycle) {
        i = knots.length - 1;
        bezierVertex(
            knots[i].rx_pt, knots[i].ry_pt,
            knots[0].lx_pt, knots[0].ly_pt,
            knots[0].x_pt, knots[0].y_pt,
        );
    }
    endShape();

}