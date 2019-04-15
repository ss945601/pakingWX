var SVG = require('svg');
var Graph = require('graph/graph.js')
var Dijkstra = require('graph/dijkstraAlgorithm.js')
var SensorDataModel = require('model/sensorDataModel.js')
var svg;
var sensorData;
var navQueue;
var floorQueue;
var graphList = [];
var nowFloor = '4F';
const FIRST_LIMIT_QSIZE = 30;

export class NavigationShareFunc {
  /**
   * 初始化設定
   * @author Steven
   * @version 2019-04-11
   */
  constructor() {
    this.init();
  }
  init() {
    this.isLoadMap = false;
    this.navHashMap = new Array();
    this.navSeqHashMap = new Array();
    this.initMapGraph();
  }
  initMapGraph() {
    SensorDataModel.sensorInfo.init();
    sensorData = SensorDataModel.sensorInfo.Data;
    if (sensorData !== undefined) {
      console.log('取得場內資訊');
      console.log(sensorData);
      this.buildMapGraph();
      this.buildNavSeqHashMap();
      this.isLoadMap = true;
    } else {
      var pointer = this;
      setTimeout(function() {
        pointer.initMapGraph();
      }, 2000);
    }
  }
  buildMapGraph() {
    for (var i = 0; sensorData[i]; i++) {
      if (!graphList[sensorData[i].floor]) {
        graphList[sensorData[i].floor] = new Graph.Graph();
      }
      if (graphList[sensorData[i].floor]) {
        graphList[sensorData[i].floor].addNode(sensorData[i].seq_id);
        var next = sensorData[i].Next_N.split(',')
        for (var j = 0; next[j]; j++)
          graphList[sensorData[i].floor].addEdge(sensorData[i].seq_id, next[j], 1);
      }
      var info = {
        [sensorData[i].sensor_id]: sensorData[i]
      };
      this.navHashMap = Object.assign({}, this.navHashMap, info);
    }
    console.log('建立全域N字典');
    console.log(this.navHashMap);
    console.log('建立有向圖');
    console.log(graphList);
    // let dij = new Dijkstra.DijkstraAlgorithm(map)
    // console.log(dij.findPathWithDijkstra(1, 7))
    // console.log(map.getEdge())
    // dij.changeCost(1, 3, 3);
  }
  buildNavSeqHashMap() {
    for (var i = 0; sensorData[i]; i++) {
      var info = {
        [sensorData[i].sensor_id]: sensorData[i]
      };
      if (nowFloor == sensorData[i].floor) {
        var info = {
          [sensorData[i].seq_id]: sensorData[i]
        };
        this.navSeqHashMap = Object.assign({}, this.navSeqHashMap, info);
      }
    }
    console.log('建立當前樓層N字典');
    console.log(this.navSeqHashMap);

  }
  sortByKey(array, key) {
    return array.sort(function(a, b) {
      var y = a[key];
      var x = b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }
  mergeQueue2HashMap(queue) {
    var output = [];
    queue.forEach(function(item) {
      var existing = output.filter(function(v, i) {
        return v.seqId == item.seqId;
      });
      if (existing.length) {
        var existingIndex = output.indexOf(existing[0]);
        output[existingIndex].RSSI = parseInt(output[existingIndex].RSSI) + parseInt((item.RSSI));
        output[existingIndex].callback = output[existingIndex].callback + 1;
      } else {
        item.RSSI = 0;
        item.callback = 0;
        output.push(item);
      }
    });
    return output;
  }
  addBle2Queue(queue, ble, limit_qSize) {
    var name = ble[0].name;
    var rssi = (parseInt(ble[0].RSSI) + 100);
    while (queue.length > limit_qSize) {
      queue.shift();
    }
    if (name.length > 0) {
      var bleSet = {
        'seqId': this.navHashMap[name].seq_id,
        'RSSI': rssi
      };
      queue.push(bleSet);
    }
  }
  /**
   * 取得timestemp和現在時間差
   *
   * @param timestemp
   * @return double 時間差(秒)
   */
  getTimestempDiff(timestemp) {
    return (Date.now() - timestemp) / 1000
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
  }
  init() {
    navQueue = new Array();
    this.callbackCount = 0;
    this.x = 0;
    this.y = 0;
    this.ansNav='';
    this.limitMaxQueueSize_Theshold = 0;
    this.limitRSSI_Theshold = 0;
    this.once = false;
    this.timeStamp = Date.now();
    this.navSharefunc = new NavigationShareFunc();
    console.log('====初始化室內導航====');
  }
  updateCurrentNode() {
    var navshareFunc = this.navSharefunc;
    this.x = parseInt(navshareFunc.navSeqHashMap[this.ansNav].x) * 1.1;
    this.y = parseInt(navshareFunc.navSeqHashMap[this.ansNav].y) * 1.1;
    console.dir('CarNavigation:' + (this.ansNav));
  }

  parameterConfig(seqAndRssi) {
    if (this.once == false) {
      this.limitMaxQueueSize_Theshold = FIRST_LIMIT_QSIZE
    } else {
      this.limitMaxQueueSize_Theshold = 5 * seqAndRssi.length;
      if (this.limitMaxQueueSize_Theshold <= 30) {
        this.limitMaxQueueSize_Theshold = 30;
      }
      if (this.limitMaxQueueSize_Theshold >= 60) {
        this.limitMaxQueueSize_Theshold = 60;
      }
      //console.log(this.limitMaxQueueSize_Theshold);
    }
  }

  isNodeConditions(seqAndRssi){
    if (this.ansNav !== seqAndRssi[0].seqId) { // 跳點對象(排行榜第一)和當前點不一樣
      this.ansNav = seqAndRssi[0].seqId;
      console.dir('CarNavigation:', this.ansNav);
      return true;
    }
    return false;
  }

  startIndoorNavigation(ble) {
    var navshareFunc = this.navSharefunc;
    var testval = (parseInt(ble[0].RSSI) + 100) % 3;
    ble[0].name = ble[0].name.replace(/\s+/g, '');
    if (navshareFunc.isLoadMap && navshareFunc.navHashMap[ble[0].name]) {
      navshareFunc.addBle2Queue(navQueue, ble, this.limitMaxQueueSize_Theshold); // 將收到的ble塞進navQueue
      var seqAndRssi = navshareFunc.mergeQueue2HashMap(navQueue);
      seqAndRssi = navshareFunc.sortByKey(seqAndRssi, 'RSSI'); // sort navQueue named seqAndRssi(以能量排名)

      /*根據每秒callback數量對參數做調整 */
      if (navshareFunc.getTimestempDiff(this.timeStamp) > 1) {
        this.parameterConfig(seqAndRssi); // 調整Node queue最大數量
        console.log('每秒callback數' + this.callbackCount);
        this.callbackCount = 1;
        this.timeStamp = Date.now()
      } else {
        this.callbackCount++;
      }

      /*跳點邏輯 */
      if (navQueue.length >= this.limitMaxQueueSize_Theshold) {
        if (this.isNodeConditions(seqAndRssi) == true) {
          this.once = true;
          this.updateCurrentNode();
          console.dir('Rank:', seqAndRssi);
        }
      }

    }
  }


}