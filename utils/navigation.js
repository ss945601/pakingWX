<<<<<<< Updated upstream
var SVG = require('svg');
var Graph = require('nav/graph.js')
var Dijkstra = require('nav/dijkstraAlgorithm.js')
var svg;
=======
var DbRequest = require('../utils/model');
var navQueue;
var callbackCount;
const FIRST_N_QSIZE = 30;

>>>>>>> Stashed changes
export class IndoorFindSpace {
  /**
   * 初始化設定
   * @author Steven
   * @version 2019-04-03
   */
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
  constructor() {
    this.init();
    this.initSensorInfo();
  }

  setSensorData(value){
    this.sensorData = value;
  }

  init() {
    navQueue = new Array();
    callbackCount = 0;
    console.log('====初始化室內導航====');
  }
  initSensorInfo() {
    var res = new DbRequest.getDataFromDB();
    res.floorSensorHttpRequest("000001");
  }
  startIndoorNavigation(ble) { 
    this.addBle2Queue(navQueue,ble); 
  }
<<<<<<< Updated upstream
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

=======
  addBle2Queue(queue,ble){
    var name = ble[0].name;
    var rssi = ble[0].RSSI;
    var bleSet = new Array();
    if (name.length > 0) {
      bleSet.push(name);
      bleSet.push(rssi);
      queue.unshift(bleSet);
    }
    if (queue.length > FIRST_N_QSIZE) {
      queue.pop();
    }
  }

} 
export const startIndoorNavigation = IndoorFindSpace.prototype.startIndoorNavigation;
export const setSensorData = IndoorFindSpace.prototype.setSensorData;
>>>>>>> Stashed changes
