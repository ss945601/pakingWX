var SVG = require('svg');
var Graph = require('nav/graph.js')
var Dijkstra = require('nav/dijkstraAlgorithm.js')
var svg;
export class IndoorFindSpace {
  /**
   * 初始化設定
   * @author Steven
   * @version 2019-04-03
   */
  constructor() {
    this.init();
  }
  init() {
    console.log('初始化室內導航');
  }
  startIndoorNavigation(ble) {   
      var name = ble[0].name;
      var rssi = ble[0].RSSI;
      console.log(name, rssi);    

  }
  test(){
    let map = new Graph.Graph()
    map.addNode("1")
    map.addNode("2")
    map.addNode("3")
    map.addNode("4")
    map.addNode("5")
    map.addNode("6")
    map.addEdge("1", "2", 1);
    map.addEdge("2", "3", 1);
    map.addEdge("3", "4", 1);
    map.addEdge("4", "5", 1);
    map.addEdge("5", "6", 1);
    map.addEdge("6", "1", 1);
    let dij = new Dijkstra.DijkstraAlgorithm(map)
    console.log(dij.findPathWithDijkstra("1","6"))
  }


} 
export const startIndoorNavigation = IndoorFindSpace.prototype.startIndoorNavigation;

