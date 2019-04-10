export class IndoorFindSpace {
  constructor(ble) {
    this.doc = new Parser.DOMParser().parseFromString(ble);
    console.log(this.doc)
  }
}