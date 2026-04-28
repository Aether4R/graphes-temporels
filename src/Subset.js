const INF = Number.MAX_SAFE_INTEGER;

class Subset {
    constructor(bits = 0, current = 0) {
        this.bits = bits;
        this.current = current;
        this.hops = INF;
        this.x = 0;
        this.y = 0;
        this.size = 0;
        this.parent = null;
        this.fresh = false;
    }

    /**
     * Copie les propriétés d'un autre subset dans celui-ci
     * @param {Subset} s - Le subset à copier
     */
    copy(s) {
        this.bits = s.bits;
        this.current = s.current;
        this.hops = s.hops;
        this.x = s.x;
        this.y = s.y;
        this.size = s.size;
        this.parent = s.parent;
        this.fresh = s.fresh;
    }

    display(offsetX = 0, offsetY = 0, zoom = 1, p = window) {
        const ctx = p;

        let X = this.x * zoom + offsetX;
        let Y = this.y * zoom + offsetY;
        let size = this.size * zoom;

        let transp = this.hops === INF ? 127 : 255;

        ctx.stroke(0, transp);
        ctx.noFill();
        ctx.rectMode(CENTER);
        ctx.square(X, Y, size);

        let r = 0.35 * size;

        for (let i = 0; i < N; i++) {

            let cx = X + r * cos(i * TWO_PI / N);
            let cy = Y + r * sin(i * TWO_PI / N);

            if (((this.bits >> i) & 1) === 1) {
                ctx.noStroke();
                ctx.fill(i === this.current ? ctx.color(0,150,255,transp) : ctx.color(0,transp));
            } else {
                ctx.stroke(0, transp);
                ctx.noFill();
            }

            ctx.circle(cx, cy, 0.2 * size);
        }

        if (this.hops < INF) {
            ctx.textAlign(CENTER, CENTER);
            ctx.textSize(max(10, 0.3 * size));
            ctx.fill(this.fresh ? 'red' : 0);
            ctx.text(this.hops, X, Y);
        }
    }
}