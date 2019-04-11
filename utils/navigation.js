var SVG = require('svg');
var Graph = require('graph/graph.js')
var Dijkstra = require('graph/dijkstraAlgorithm.js')
var svg;
var sensorData;
var DbRequest = require('../utils/model');
var navQueue;
var callbackCount;
const FIRST_N_QSIZE = 30;
 

export class SensorData {
  /**
   * 初始化設定
   * @author Steven
   * @version 2019-04-11
   */
  constructor() {}
  setSensorData(value) {
    sensorData = value;
  }
}
export class IndoorFindSpace {
  /**
   * 初始化設定
   * @author Steven
   * @version 2019-04-11
   */

  constructor() {
    this.init();
    this.initSensorInfo();
    this.checkVariable();
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
  checkVariable(){
    console.log(sensorData);
    if (sensorData !== undefined) {
      this.initMapGraph();
    }else{
      var pointer = this;
      setTimeout(function () {
        pointer.checkVariable();
      }, 2000);
    }
  }
  initMapGraph() {
    var graphMap = [];
    var isUpdateMap = false;
    let map = new Graph.Graph()
    for (var i = 0; sensorData[i]; i++) {
      if (!graphMap[sensorData[i].floor]) {
        graphMap[sensorData[i].floor] = new Array();
        console.log(graphMap);
      }
    }
    map.addNode(1)
    map.addNode(2)
    map.addNode(3)
    map.addNode(4)
    map.addNode(5)
    map.addNode(7)
    map.addEdge(1, 2, 1);
    map.addEdge(1, 5, 1);
    map.addEdge(2, 3, 1);
    map.addEdge(3, 4, 1);
    map.addEdge(4, 5, 1);
    map.addEdge(5, 7, 1);
    map.addEdge(7, 1, 1);
    let dij = new Dijkstra.DijkstraAlgorithm(map)
    console.log(dij.findPathWithDijkstra(1, 7))
    console.log(map.getEdge())
    dij.changeCost(1, 3, 3);
  }
  startIndoorNavigation(ble) {
    this.addBle2Queue(navQueue, ble);

  }
  addBle2Queue(queue, ble) {
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
export const setSensorData = SensorData.prototype.setSensorData;