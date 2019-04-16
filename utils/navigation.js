var SVG = require('svg');
var Graph = require('graph/graph.js')
var Dijkstra = require('graph/dijkstraAlgorithm.js')
var SensorDataModel = require('model/sensorDataModel.js')
var svg;
var sensorData;
var navQueue;
var floorQueue;
var graphList = [];
var nowFloor = '3F'; 
var seqAndRssi;
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

  stringRemoveSpace(str) {
    return str.replace(/\s+/g, '');
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

  /**
   * 在array中根據Key找出有無包含value
   * Array[[Key1:value1,Key2:value2],[Key1:value3,Key2:value4]]
   * @author chieh
   * @version 2019-04-15
   */
  arrayKeyContains(array, key, value) {
    var isContains = false
    array.some(item => {
      if (item[key] == value) {
        isContains = true
        return true
      }
    })
    return isContains
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
    this.scale = 1.2;
    this.ansNav = '';
    this.lastNav = '';
    this.limitMaxQueueSize_Theshold = 0;
    this.limitRSSI_Theshold = 0;
    this.once = true; // 第一次收
    this.isSwitchGetBle = false;
    this.lastBle = '' ;
    this.timeStamp = Date.now();
    this.navSharefunc = new NavigationShareFunc();
    console.log('====初始化室內導航====');
  }


  updateCurrentNode() {
    var navshareFunc = this.navSharefunc;
    this.x = parseInt(navshareFunc.navSeqHashMap[this.ansNav].x) * 1.0;
    this.y = parseInt(navshareFunc.navSeqHashMap[this.ansNav].y) * 1.0 ;
    console.log('CarNavigation:' + (this.ansNav));
    console.log('===============================');
    this.lastNav = this.ansNav;
  }

  parameterConfig() {
    if (this.once == true) {
      this.limitMaxQueueSize_Theshold = FIRST_LIMIT_QSIZE
    } else {
      this.limitMaxQueueSize_Theshold = 5 * seqAndRssi.length; // 設定queue size
      this.scale = 1.1 + ((this.callbackCount - 5) / 5) * 0.05;

      if (this.limitMaxQueueSize_Theshold > 30) {
        this.isSwitchGetBle = true;
      }
      if (this.limitMaxQueueSize_Theshold <= 30) {
        this.limitMaxQueueSize_Theshold = 30;
      }
      if (this.limitMaxQueueSize_Theshold >= 60) {
        this.limitMaxQueueSize_Theshold = 60;
      }
      //console.log(this.limitMaxQueueSize_Theshold);
    }
  }

  filterBLE(ble) {
    var navshareFunc = this.navSharefunc;
    if (this.ansNav!=''){ // test
      ble[0].name = navshareFunc.navSeqHashMap[navshareFunc.navSeqHashMap[this.ansNav].Next_N.split(',')[0]].sensor_id;
    }
    ble[0].name = navshareFunc.stringRemoveSpace(ble[0].name); //去除空白
    var thres_rssi = (-100 + this.callbackCount / 4);

    if (parseInt(ble[0].RSSI) < thres_rssi) // rssi 太小
      return false;
    if (!navshareFunc.navHashMap[ble[0].name]) //非場內ble
      return false;
    if (navshareFunc.navHashMap[ble[0].name].floor !== nowFloor) 
      return false;
   
    return true;
  }

  isNodeConditions() {
    var navshareFunc = this.navSharefunc;
    if (this.ansNav !== seqAndRssi[0].seqId) { // 跳點對象(排行榜第一)和當前點不一樣
      if (this.once) {
        this.ansNav = seqAndRssi[0].seqId;
        return true;
      } else {
        let rankOfFirstNode = seqAndRssi[0].seqId;
        var nextN = navshareFunc.navSeqHashMap[this.ansNav].Next_N.split(",");
        if (nextN.includes(rankOfFirstNode) ) {
          if (seqAndRssi.length >= 2 && seqAndRssi[0].RSSI > seqAndRssi[1].RSSI * this.scale) {
            this.ansNav = rankOfFirstNode;
            return true;
          }
        }
      }
    }
    //刷點條件
    if (!navshareFunc.arrayKeyContains(seqAndRssi, 'seqId', this.ansNav)) {
      if (seqAndRssi.length == 1) {
        this.ansNav = seqAndRssi[0].seqId;
        console.log('刷點成功' + this.ansNav);
        return true;
      } 
      else if (navshareFunc.navSeqHashMap[seqAndRssi[0].seqId].Next_N.split(',').includes("" + seqAndRssi[1].seqId) || navshareFunc.navSeqHashMap[seqAndRssi[1].seqId].Next_N.split(',').includes("" + seqAndRssi[0].seqId)) {
        this.ansNav = seqAndRssi[0].seqId;
        console.log('刷點成功' + this.ansNav);
        return true;
      }
      console.log('刷點失敗')
    }

    return false;
  }

  preProcessBLE(ble){
    var navshareFunc = this.navSharefunc;
    if (this.filterBLE(ble) == false) // 過濾ble rssi, 是否為場內beacon
      return false;
    if (navshareFunc.getTimestempDiff(this.timeStamp) > 1) {
      this.parameterConfig(); // 調整Node queue最大數量
      console.log('每秒callback數' + this.callbackCount);
      this.callbackCount = 1;
      this.timeStamp = Date.now()
    }
    if (this.isSwitchGetBle) { // 是否啟動交替收 
      if (this.lastBle != '' && ble[0].name === this.lastBle) {
        return false;
      } else {
        this.lastBle = ble[0].name;   
      }
    }
    return true;
  }

  startIndoorNavigation(ble) {
    var navshareFunc = this.navSharefunc;
    /*根據每秒callback數量對參數做調整 */
 
    if (this.preProcessBLE(ble) == false)
      return;

    if (navshareFunc.isLoadMap) {
      this.callbackCount++;
      navshareFunc.addBle2Queue(navQueue, ble, this.limitMaxQueueSize_Theshold); // 將收到的ble塞進navQueue
      var tmp = navshareFunc.mergeQueue2HashMap(navQueue);
      seqAndRssi = navshareFunc.sortByKey(tmp, 'RSSI'); // sort navQueue named seqAndRssi(以能量排名)

      /*跳點邏輯 */
      if (navQueue.length >= this.limitMaxQueueSize_Theshold) {
        if (this.isNodeConditions() == true) {
          this.once = false;
          this.updateCurrentNode();
          console.log('Rank:', seqAndRssi);
        }
      }

    }
  }


}