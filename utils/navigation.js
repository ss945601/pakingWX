var SVG = require('svg');
var Graph = require('graph/graph.js')
var Dijkstra = require('graph/dijkstraAlgorithm.js')
var SensorDataModel = require('model/sensorDataModel.js')
var svg;
var sdm;
var sensorData;
var navQueue;
var callbackCount;
const FIRST_N_QSIZE = 30;
 

export class IndoorFindSpace {
  /**
   * 初始化設定
   * @author Steven
   * @version 2019-04-11
   */

  constructor() {
    this.init();
    this.initMapGraph();
  } 
  init() {
    navQueue = new Array();
    callbackCount = 0; 
    console.log('====初始化室內導航====');
  }
  initMapGraph(){  
    SensorDataModel.sensorInfo.init();
    sensorData = SensorDataModel.sensorInfo.Data;
    if (sensorData !== undefined) {
      console.log('取得場內資訊');
      console.log(sensorData);
      this.buildMapGraph();
    }else{
      var pointer = this;
      setTimeout(function () {
        pointer.initMapGraph();
      }, 2000);
    }
  }
  buildMapGraph() {
    var graphList = [];
    var isUpdateMap = false;
    for (var i = 0; sensorData[i]; i++) {
      if (!graphList[sensorData[i].floor]) {
        graphList[sensorData[i].floor] = new Graph.Graph();
      }
      if (graphList[sensorData[i].floor]){
        graphList[sensorData[i].floor].addNode(sensorData[i].seq_id);
        graphList[sensorData[i].floor].addEdge(sensorData[i].seq_id, sensorData[i].Next_N,1);
      }
    }
    console.log('建立有向圖');
    console.log(graphList);
    // let dij = new Dijkstra.DijkstraAlgorithm(map)
    // console.log(dij.findPathWithDijkstra(1, 7))
    // console.log(map.getEdge())
    // dij.changeCost(1, 3, 3);
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

