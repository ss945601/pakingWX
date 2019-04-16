export class Point2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  /**
   * Set the point's x and y coordinates
   * @param x
   * @param y
   */
  setXY(x, y) {
    this.x = x;
    this.y = y;
  }
  /**
   * Set the point's x and y coordinates
   * @param Point
   */
  setXY(p) {
    this.x = p.x;
    this.y = p.y;
  }
  offset(dx, dy) {
    this.x += dx;
    this.y += dy;
}
  toString() {
    return 'Point(' + this.x + ', ' + this.y + ')';
  }
}