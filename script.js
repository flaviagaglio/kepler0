const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('boot-modal');
const btnStart = document.getElementById('btn-start');
const bodiesCountEl = document.getElementById('val-bodies');

let scale = 1.0;
let centerX = 0;
let centerY = 0;
let isRunning = false;

// setup and scale
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
    
    // mobile scaling
    if (window.innerWidth < 768) {
        scale = 0.45;
    } else {
        scale = 1.0;
    }
}
window.addEventListener('resize', resize);
resize();

const G = 1.2;
const DT = 0.04;
const DAMPING = 100;

class Body {
    constructor(x, y, vx, vy, mass, radius, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.radius = radius;
        this.color = color;
        this.trail = [];
        this.trailLength = 90;
    }

    update(bodies) {
        if (!isRunning) return;

        let fx = 0;
        let fy = 0;

        for (let i = 0; i < bodies.length; i++) {
            let other = bodies[i];
            if (other === this) continue;

            let dx = other.x - this.x;
            let dy = other.y - this.y;
            let distSq = dx * dx + dy * dy + DAMPING;
            let dist = Math.sqrt(distSq);

            let force = (G * this.mass * other.mass) / distSq;
            fx += force * (dx / dist);
            fy += force * (dy / dist);
        }

        let ax = fx / this.mass;
        let ay = fy / this.mass;

        this.vx += ax * DT;
        this.vy += ay * DT;

        this.x += this.vx * DT;
        this.y += this.vy * DT;

        if (Math.random() < 0.3) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }
        }
    }

    draw() {
        // draw orbit trail
        ctx.beginPath();
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1.5;
        
        for (let i = 0; i < this.trail.length; i++) {
            let pt = this.trail[i];
            let px = centerX + pt.x * scale;
            let py = centerY + pt.y * scale;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // draw body
        let screenX = centerX + this.x * scale;
        let screenY = centerY + this.y * scale;

        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#111111';
        ctx.stroke();
    }
}

// init state
const bodies = [
    new Body(0, 0, 0, 0, 6000, 20, '#ff5000'), 
    new Body(0, -140, 6.8, 0, 15, 6, '#111111'),
    new Body(0, -240, 5.2, 0, 30, 8, '#ffffff'),
    new Body(0, -380, 4.0, 0, 45, 10, '#00aaff'),
    new Body(0, -550, 3.2, 0, 10, 5, '#111111')
];

bodiesCountEl.innerText = bodies.length;

// interaction handler
function addBody(e) {
    if (!isRunning) return;
    
    // prevent default mobile scroll
    if (e.cancelable) {
        e.preventDefault();
    }

    const rect = canvas.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }

    let mouseX = clientX - rect.left;
    let mouseY = clientY - rect.top;

    let simX = (mouseX - centerX) / scale;
    let simY = (mouseY - centerY) / scale;

    let mass = 10 + Math.random() * 50;
    let radius = Math.max(4, mass / 5);
    let vx = (Math.random() - 0.5) * 8;
    let vy = (Math.random() - 0.5) * 8;
    
    const colors = ['#111111', '#ffffff', '#ff5000', '#00aaff'];
    let color = colors[Math.floor(Math.random() * colors.length)];

    bodies.push(new Body(simX, simY, vx, vy, mass, radius, color));
    bodiesCountEl.innerText = bodies.length;
}

canvas.addEventListener('mousedown', addBody);
canvas.addEventListener('touchstart', addBody, { passive: false });

btnStart.addEventListener('click', () => {
    modal.style.display = 'none';
    isRunning = true;
});

// render loop
function animate() {
    ctx.fillStyle = '#e5e5e5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < bodies.length; i++) {
        bodies[i].update(bodies);
        bodies[i].draw();
    }

    requestAnimationFrame(animate);
}

animate();