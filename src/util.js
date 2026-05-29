/**
 * Calcule la distance entre un segment et un point
 * @param {p5.Vector} a - Le premier point du segment
 * @param {p5.Vector} b - Le deuxième point du segment
 * @param {p5.Vector} p - Le point
 * @returns {number} - La distance
 */
function distSegPoint(a, b, p) {
  let n = p5.Vector.sub(b, a);
  let t = constrain(n.dot(p5.Vector.sub(p, a)) / n.magSq(), 0, 1);
  let proj = p5.Vector.add(a, n.copy().mult(t));
  return p.dist(proj);
}

function oneCount(x) {
    let count = 0;
    while (x != 0){
        if ((x & 1) == 1){
            count++;
        }
        x >>= 1;
    }
    return count;
}

export function binomial(n) {
  let row = [1];

  for (let i = 0; i < n; i++) {
    let next = [1];

    for (let j = 1; j < row.length; j++) {
      next[j] = row[j - 1] + row[j];
    }

    next.push(1);
    row = next;
  }

  return row;
}