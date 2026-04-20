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

    display(p = null) {
        const ctx = p || window;
        let transp = this.hops === INF ? 127 : 255;

        ctx.stroke(0, transp);
        ctx.noFill();
        ctx.rectMode(CENTER);
        ctx.square(this.x, this.y, this.size);

        let r = 0.35 * this.size;

        for (let i = 0; i < N; i++) {
            if (((this.bits >> i) & 1) === 1) {
                ctx.noStroke();
                ctx.fill(i === this.current ? ctx.color(0, 150, 255, transp) : ctx.color(0, transp));
            } else {
                ctx.stroke(0, transp);
                ctx.noFill();
            }

            ctx.circle(
                this.x + r * cos(i * TWO_PI / N),
                this.y + r * sin(i * TWO_PI / N),
                0.2 * this.size
            );
        }

        if (this.hops < INF) {
            ctx.textAlign(CENTER, CENTER);
            ctx.textSize(0.3 * this.size);
            ctx.fill(this.fresh ? ctx.color(255, 0, 0) : ctx.color(0));
            ctx.text(this.hops, this.x, this.y);
        }
    }
}