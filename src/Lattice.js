class Lattice{
    constructor(x0, y0, w, h, hSnap) {
        this.x0 = x0;
        this.y0 = y0;
        this.w = w;
        this.h = h;
        this.hSnap = hSnap;
        
        let subsetsTmp = Array(N).fill(null).map(() => []);
        for (let c = 0; c < N; c++) {
            subsetsTmp[c].push(null);
        }
        
        for (let s = 1; s < (1 << N); s += 2) {
            let c = oneCount(s >> 1);
            for (let i = 0; i < N; i++) {
                if (((s >> i) & 1) === 1) {
                    subsetsTmp[c].push(new Subset(s, i));
                }
            }
            subsetsTmp[c].push(null);
        }
        
        let maxPerRow = 0;
        for (let l of subsetsTmp) {
            maxPerRow = max(maxPerRow, l.length);
        }
        let size = this.w / maxPerRow;
        let yGap = (this.h - N * size) / (N + 1);
        
        let y = this.y0 + yGap + size / 2;
        for (let c = N - 1; c >= 0; c--) {
            let row = subsetsTmp[c];
            let n = (row.length - 1) / (c + 2);
            let xGap = (this.w - n * (c + 1) * size) / (n + 1);
            let x = size / 2;
            
            for (let sub of row) {
                if (sub !== null) {
                    sub.x = x;
                    sub.y = y;
                    sub.size = size;
                    x += size;
                } else {
                    x += xGap;
                }
            }
            y += yGap + size;
        }
        
        let table = new Table();
        for (let row of subsetsTmp) {
            for (let sub of row) {
                if (sub !== null) {
                    table.subsets[sub.current][sub.bits >> 1] = sub;
                }
            }
        }
        table.subsets[0][0].hops = 0;
        
        this.tables = [];
        this.tables.push(table);
        this.snapshots = [];
    }

    display(){
        this.tables[this.tables.length - 1].display();
        console.log(this.tables[this.tables.length - 1].phi());
        for (let i = 0; i < this.snapshots.length; i++){
            this.snapshots[i].display();
        }
    }

    addSnapshot(snapshot) {
        if (this.snapshots.length > 0){
            let n = this.snapshots.length - 1;
            let last = this.snapshots[n];
            last.setPos(this.hSnap * (0.5 + n), this.h + this.hSnap / 2, 0.9 * this.hSnap / 2);
        }
        this.snapshots.push(snapshot);
        this.tables.push(new Table(this.tables[this.tables.length - 1]));
        this.update();
    }

    update() {
        let n = this.tables.length;
        let prev = this.tables[n - 2];
        let next = this.tables[n - 1];
        let snapshot = this.snapshots[n - 2];
        prev.updateNext(snapshot, next);
    }
}