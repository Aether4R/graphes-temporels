class Button {
    constructor(x, y, w, h, text) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.text = text;
        this.disabled = true;
    }

    display(){
        noStroke();
        fill(this.disabled ? 191 : 0);
        rectMode(CENTER);
        rect(this.x, this.y, this.w, this.h, 20);
        textAlign(CENTER, CENTER);
        textSize(0.5 * this.h);
        fill(255);
        text(this.text, this.x, this.y);
    }

    click(){
        return !this.disabled && this.x - this.w / 2 < mouseX && mouseX < this.x + this.w / 2 && this.y - this.h / 2 < mouseY && mouseY < this.y + this.h / 2;
    }
}