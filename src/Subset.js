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

    display() {
        let transp = this.hops === INF ? 127 : 255;

        stroke(0, transp);
        noFill();
        rectMode(CENTER);
        square(this.x, this.y, this.size);

        let r = 0.35 * this.size;

        for (let i = 0; i < N; i++) {
            if (((this.bits >> i) & 1) === 1) {
                noStroke();
                fill(i === this.current ? color(0, 150, 255, transp) : color(0, transp));
            } else {
                stroke(0, transp);
                noFill();
            }

            circle(
                this.x + r * cos(i * TWO_PI / N),
                this.y + r * sin(i * TWO_PI / N),
                0.2 * this.size
            );
        }

        if (this.hops < INF) {
            textAlign(CENTER, CENTER);
            textSize(0.3 * this.size);
            fill(this.fresh ? color(255, 0, 0) : color(0));
            text(this.hops, this.x, this.y);
        }
    }
}