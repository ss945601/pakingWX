var SVG = require('svg');
var Graph = require('graph/graph.js')
var Dijkstra = require('graph/dijkstraAlgorithm.js')
var SensorDataModel = require('model/sensorDataModel.js')
var Point2D = require('graph/point2D.js')
var svg;
var sensorData;
var navQueue;
var graphList = [];
var nowFloor = '';
var seqAndRssi;
var istestMode = false;
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
    this.n2nextNdis = 0
    this.initMapGraph();
  }
  initMapGraph() {
    SensorDataModel.sensorInfo.init();
    sensorData = SensorDataModel.sensorInfo.Data;
    if (sensorData !== undefined) {
      console.log('取得場內資訊(sensorData)');
      console.log(sensorData);
      this.buildMapGraph();
      // this.buildNavSeqHashMap();
      // this.buildFloorDijkstra();
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
    console.log('建立全域N字典(navHashMap)');
    console.log(this.navHashMap);
    console.log('建立有向圖(graphList)');
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
        sensorData[i].Next_N = sensorData[i].Next_N.split(',')
        var info = {
          [sensorData[i].seq_id]: sensorData[i]
        };
        this.navSeqHashMap = Object.assign({}, this.navSeqHashMap, info);
      }
    }
    console.log('建立當前樓層N字典(navSeqHashMap)');
    console.log(this.navSeqHashMap);
    this.n2nextNdis = this.calcN2nextNdis()
  }
  calcN2nextNdis() {
    var edgeSize = 0
    var dis = 0
    for (var seq in this.navSeqHashMap) {
      this.navSeqHashMap[seq].Next_N.forEach(nextN => {
        dis += this.getDistanceBetweenPoints(this.getPointBySeqID(this.navSeqHashMap[seq].seq_id), this.getPointBySeqID(nextN))
        edgeSize++
      })
    }
    if (edgeSize != 0)
      return dis / edgeSize
  }

  buildFloorDijkstra() {
    this.floorDijkstra = new Dijkstra.DijkstraAlgorithm(graphList[nowFloor]);
    console.log('建立樓層Dijkstra(floorDijkstra)');
    console.log(this.floorDijkstra);
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
  /**
   * 限制數值上下限
   *
   * @param x     範圍
   * @param y     範圍
   * @param value 值
   * @return 值
   */
  getLimitBound(x, y, value) {
    if (x > y) {
      if (value > x)
        return x;
      else if (value < y)
        return y;
      return value;
    } else if (y > x) {
      if (value > y)
        return y;
      else if (value < x)
        return x;
      return value;
    } else {
      return x;
    }
  }
  /**
   * 多點定位
   */
  getMultiLocationPoint(seqAndRssi) {
    var multiPointLocationX = 0;
    var multiPointLocationY = 0;
    var sumValue = 0;
    for (var i = 0; i < seqAndRssi.length && seqAndRssi[i].RSSI > 0; i++) {
      sumValue = sumValue + seqAndRssi[i].RSSI;
    }
    for (var i = 0; i < seqAndRssi.length; i++) {
      if (seqAndRssi[i].RSSI > 0 && this.navSeqHashMap[seqAndRssi[i].seqId]) {
        multiPointLocationX = multiPointLocationX + this.navSeqHashMap[seqAndRssi[i].seqId].x * (seqAndRssi[i].RSSI / sumValue)
        multiPointLocationY = multiPointLocationY + this.navSeqHashMap[seqAndRssi[i].seqId].y * (seqAndRssi[i].RSSI / sumValue)
      } else
        break;
    }
    return new Point2D.Point2D(multiPointLocationX, multiPointLocationY);
  }

  getPointBySeqID(seqId) {
    var seqIdX = this.navSeqHashMap[seqId].x;
    var seqIdY = this.navSeqHashMap[seqId].y;
    return new Point2D.Point2D(seqIdX, seqIdY);
  }

  getDistanceBetweenPoints(p1, p2) {
    return Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
  }

  getstandardDeviation = (arr, usePopulation = false) => {
    const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
    return Math.sqrt(
      arr.reduce((acc, val) => acc.concat((val - mean) ** 2), []).reduce((acc, val) => acc + val, 0) /
      (arr.length - (usePopulation ? 0 : 1))
    );
  };

}

export class NavChangeFloor {
  constructor(navSharefunc) {
    this.navSharefunc = navSharefunc
    this.init()
  }
  init() {
    this.floorQueue = new Array()
    this.floorArea = new Array() //樓層rssi總和
    this.limitMaxQueueSize_Theshold = 10;
  }
  filterBLE(ble) {
    if (!this.navSharefunc.navHashMap[ble[0].name]) //非場內ble
      return false;
    return true
  }
  isChangeFloor(ble) {
    if (this.filterBLE(ble)) {
      var name = ble[0].name;
      var sensorfloor = this.navSharefunc.navHashMap[name].floor
      var rssi = (parseInt(ble[0].RSSI) + 100);
      var seqId = this.navSharefunc.navHashMap[name].seq_id
      if (name.length > 0) {
        var bleSet = {
          'floor': sensorfloor,
          'seqId': seqId,
          'RSSI': rssi
        };
        this.floorQueue.push(bleSet);
      }
      while (this.floorQueue.length > this.limitMaxQueueSize_Theshold) {
        this.floorQueue.shift();
      }

      if (this.floorQueue.length > 5) {
        this.floorQueue.forEach(floorQueueObj => {
          if (!this.floorArea.some(obj => obj.floor == floorQueueObj.floor)) {
            var floorSet = {
              'floor': floorQueueObj.floor,
              'RSSI': 0
            };
            this.floorArea.push(floorSet);
          }
          this.floorArea[this.floorArea.findIndex(obj => obj.floor == floorQueueObj.floor)].RSSI += floorQueueObj.RSSI
        })
        this.floorArea = this.navSharefunc.sortByKey(this.floorArea, 'RSSI')
        if (nowFloor != this.floorArea[0].floor) {
          nowFloor = this.floorArea[0].floor
          console.info("換樓層: ")
          console.info(nowFloor)
          this.floorArea = []
          return true
        }

      }
    }
    this.floorArea = []
    return false
  }
  changeFloor() {


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
    this.shareClassInit();
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
    this.lastBle = '';
    this.timeStamp = Date.now();
    this.carSpeed = 0;
    this.isParkingStop = true;
    this.multiLocationTraceQueue = new Array();
    console.log('====初始化室內導航====');
  }
  shareClassInit() {
    this.navSharefunc = new NavigationShareFunc();
    this.changeFloorfunc = new NavChangeFloor(this.navSharefunc)
  }
  changeFloorinit() {
    this.init();
    this.navSharefunc.buildNavSeqHashMap();
    this.navSharefunc.buildFloorDijkstra();
  }

  updateCurrentNode() {
    var navshareFunc = this.navSharefunc;
    if (this.ansNav === this.lastNav) {
      return;
    }
    this.x = parseInt(navshareFunc.navSeqHashMap[this.ansNav].x) * 1.0;
    this.y = parseInt(navshareFunc.navSeqHashMap[this.ansNav].y) * 1.0;
    console.log('CarNavigation:' + (this.ansNav));
    console.log('===============================');
    this.lastNav = this.ansNav;
  }

  parameterConfig() {
    var navshareFunc = this.navSharefunc;
    if (this.once == true) {
      this.limitMaxQueueSize_Theshold = FIRST_LIMIT_QSIZE
    } else {
      this.limitMaxQueueSize_Theshold = 5 * seqAndRssi.length; // 設定queue size
      this.scale = 1.1 + ((this.callbackCount - 5) / 5) * 0.05;

      if (this.limitMaxQueueSize_Theshold > 30) {
        this.isSwitchGetBle = true;
      }
      if (this.carSpeed < navshareFunc.n2nextNdis / 3.8) {
        this.isParkingStop = true;
      } else {
        this.isParkingStop = false;
      }
      this.scale = navshareFunc.getLimitBound(1.1, 1.2, this.scale);
      this.limitMaxQueueSize_Theshold = navshareFunc.getLimitBound(30, 60, this.limitMaxQueueSize_Theshold)
      //console.log(this.limitMaxQueueSize_Theshold);
      console.info('車速：' + this.carSpeed + '停止：' + this.isParkingStop);
    }
  }

  filterBLE(ble) {
    var navshareFunc = this.navSharefunc;
    if (this.ansNav != '' && istestMode) { // test
      ble[0].name = navshareFunc.navSeqHashMap[navshareFunc.navSeqHashMap[this.ansNav].Next_N[0]].sensor_id;
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

  isChangeNodeAlgorithm() {
    var navshareFunc = this.navSharefunc;
    //一般倍率跳點
    if (this.ansNav !== seqAndRssi[0].seqId) { // 跳點對象(排行榜第一)和當前點不一樣
      // 室內導航演算法
      if (this.once) { //第一次跳點
        this.ansNav = seqAndRssi[0].seqId;
        return true;
      } else {
        let rankOfFirstNode = seqAndRssi[0].seqId;
        var nextN = navshareFunc.navSeqHashMap[this.ansNav].Next_N;
        var rankOfFirstNodePosition = navshareFunc.getPointBySeqID(rankOfFirstNode);
        var multiPosition = navshareFunc.getMultiLocationPoint(seqAndRssi);
        var dist = navshareFunc.getDistanceBetweenPoints(multiPosition, rankOfFirstNodePosition);
        var lr = navshareFunc.floorDijkstra.findPathWithDijkstra(this.ansNav, rankOfFirstNode);
        var order = Number.MAX_SAFE_INTEGER

        if (nextN.includes(rankOfFirstNode)) { // 正常跳點
          nextN.forEach(function(element) {
            var next2N = navshareFunc.navSeqHashMap[element].Next_N
            next2N.forEach(function(node) {
              var tmp = -1;
              for (var i = 0; seqAndRssi[i]; i++) {
                if (seqAndRssi[i].seqId == node)
                  tmp = i;
              }
              if (tmp != -1 && tmp < order) {
                order = tmp;
              }
            });
          });

          if (seqAndRssi.length >= 2 && seqAndRssi[0].RSSI > seqAndRssi[1].RSSI * this.scale && dist < navshareFunc.n2nextNdis) {
            if (nextN.length == 1) {
              this.ansNav = rankOfFirstNode;
              console.warn('單向倍率跳點' + dist + '<' + navshareFunc.n2nextNdis);
              console.log('下下點:', order);
              return true;
            } else if (nextN.length > 1) {
              if (order < 4) {
                this.ansNav = rankOfFirstNode;
                console.warn('雙向倍率跳點' + dist + '<' + navshareFunc.n2nextNdis);
                console.log('下下點:', order);
                return true;
              }
            }
          }
        }
        if (((lr >= 2 && nextN.length == 1 && !this.isParkingStop) || (lr == 1 && nextN.length > 1)) && dist < (navshareFunc.n2nextNdis / (nextN.length + 3))) {
          this.ansNav = rankOfFirstNode;
          console.warn('多點定位跳點:' + dist + '<' + navshareFunc.n2nextNdis + ',跳點長度：' + (lr.length - 1));
          return true;
        }
      }

    }
    //刷點條件
    if (!navshareFunc.arrayKeyContains(seqAndRssi, 'seqId', this.ansNav)) {
      if (seqAndRssi.length == 1) {
        this.ansNav = seqAndRssi[0].seqId;
        console.warn('刷點成功' + this.ansNav);
        return true;
      } else if (navshareFunc.navSeqHashMap[seqAndRssi[0].seqId].Next_N.includes("" + seqAndRssi[1].seqId) || navshareFunc.navSeqHashMap[seqAndRssi[1].seqId].Next_N.includes("" + seqAndRssi[0].seqId)) {
        this.ansNav = seqAndRssi[0].seqId;
        console.log('刷點成功' + this.ansNav);
        return true;
      }
      console.log('刷點失敗')
    }

    return false;
  }

  getStdFromMultiLocationTrace() {
    var navshareFunc = this.navSharefunc;
    var multiPosition = navshareFunc.getMultiLocationPoint(seqAndRssi);
    this.multiLocationTraceQueue.push(multiPosition);
    while (this.multiLocationTraceQueue.length > 5) {
      this.multiLocationTraceQueue.shift();
    }
    console.log(this.multiLocationTraceQueue);
    var distArray = new Array();
    this.multiLocationTraceQueue.forEach(function(element) {
      distArray.push(navshareFunc.getDistanceBetweenPoints(element, multiPosition));
    });
    var std = navshareFunc.getstandardDeviation(distArray);
    return std;
  }

  preProcessBLE(ble) {
    var navshareFunc = this.navSharefunc;
    if (this.filterBLE(ble) == false) // 過濾ble rssi, 是否為場內beacon
      return false;
    if (navshareFunc.getTimestempDiff(this.timeStamp) > 1) {
      this.parameterConfig(); // 調整Node queue最大數量
      console.log('每秒callback數' + this.callbackCount);
      if (seqAndRssi !== undefined) {
        this.carSpeed = this.getStdFromMultiLocationTrace();
        //console.log('多點定位位移標準差：'+ std);
      }
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

    if (this.changeFloorfunc.isChangeFloor(ble)) {
      this.changeFloorinit()
      console.info(this.changeFloorfunc.floorQueue)
      tmp = this.changeFloorfunc.floorQueue.filter(obj => {
        return obj.floor == nowFloor
      })
      tmp.forEach(function(item) {
        delete item['floor'];
        navQueue.push(item);
      });
      console.info(navQueue)
      this.changeFloorfunc.changeFloor()
    }

    if (this.preProcessBLE(ble) == false)
      return;

    if (navshareFunc.isLoadMap) {
      this.callbackCount++;
      navshareFunc.addBle2Queue(navQueue, ble, this.limitMaxQueueSize_Theshold); // 將收到的ble塞進navQueue
      var tmp = navshareFunc.mergeQueue2HashMap(navQueue);
      seqAndRssi = navshareFunc.sortByKey(tmp, 'RSSI'); // sort navQueue named seqAndRssi(以能量排名)
      /*跳點邏輯 */
      if (navQueue.length >= this.limitMaxQueueSize_Theshold) {
        if (this.isChangeNodeAlgorithm() == true) {
          this.once = false;
          this.updateCurrentNode();
          console.log('Rank:', seqAndRssi);
        }
      }

    }
  }


}

export class IndoorFindSpaceAndroid {
  /**
   * 初始化設定
   * @author chieh
   * @version 2019-04-16
   */

  constructor() {
    this.init();
    this.shareClassInit();
  }
  init() {
    navQueue = new Array();
    this.callbackCount = 0;
    this.thresCount = 0;
    this.x = 0;
    this.y = 0;
    this.scale = 1.1;
    this.ansNav = '';
    this.lastNav = '';
    this.limitMaxQueueSize_Theshold = 0;
    this.limitRSSI_Theshold = 0;
    this.once = true; // 第一次收
    this.isSwitchGetBle = false;
    this.lastBle = '';
    this.timeStamp = Date.now();
    this.switchTime = Date.now(); //點停留時間
    this.carNavNowLocationPoint = new Point2D.Point2D(0, 0);
    console.log('====初始化室內導航====');
  }
  shareClassInit() {
    this.navSharefunc = new NavigationShareFunc();
    this.changeFloorfunc = new NavChangeFloor(this.navSharefunc)
  }
  changeFloorinit() {
    this.init();
    this.navSharefunc.buildNavSeqHashMap();
    this.navSharefunc.buildFloorDijkstra();
  }

  updateCurrentNode() {
    var navshareFunc = this.navSharefunc;
    this.x = parseInt(navshareFunc.navSeqHashMap[this.ansNav].x) * 1.0;
    this.y = parseInt(navshareFunc.navSeqHashMap[this.ansNav].y) * 1.0 - 50;
    this.lastNav = this.ansNav;
  }

  parameterConfig(seqAndRssi) {
    var navshareFunc = this.navSharefunc;
    if (this.once == true) {
      this.limitMaxQueueSize_Theshold = FIRST_LIMIT_QSIZE
    } else {
      this.isSwitchGetBle = !(this.callbackCount < 20);
      if (this.callbackCount < 20) {
        if (this.callbackCount < 3) {
          this.limitMaxQueueSize_Theshold = Math.max(8, navshareFunc.getLimitBound(50, 0, this.thresCount));
          return
        } else {
          this.limitMaxQueueSize_Theshold = Math.max(15, navshareFunc.getLimitBound(50, 0, this.thresCount));
          return
        }
      }
      if (this.thresCount > 30) {
        this.limitMaxQueueSize_Theshold = navshareFunc.getLimitBound(50, 30, this.thresCount);
        return
      } else {
        this.limitMaxQueueSize_Theshold = 30;
        return
      }
    }
  }

  filterBLE(ble) {
    var navshareFunc = this.navSharefunc;
    if (this.ansNav != '' && istestMode) { // test
      ble[0].name = navshareFunc.navSeqHashMap[navshareFunc.navSeqHashMap[this.ansNav].Next_N[0]].sensor_id;
    }
    ble[0].name = navshareFunc.stringRemoveSpace(ble[0].name); //去除空白
    var thres_rssi = -101;

    if (parseInt(ble[0].RSSI) < thres_rssi) // rssi 太小
      return false;
    if (!navshareFunc.navHashMap[ble[0].name]) //非場內ble
      return false;
    if (navshareFunc.navHashMap[ble[0].name].floor !== nowFloor)
      return false;

    return true;
  }

  preProcessBLE(ble) {
    var navshareFunc = this.navSharefunc;
    if (this.filterBLE(ble) == false) // 過濾ble rssi, 是否為場內beacon
      return false;
    if (navshareFunc.getTimestempDiff(this.timeStamp) > 2) {
      console.log('callbackCount: ' + this.callbackCount);
      if (this.callbackCount != 1) {
        if (this.callbackCount > this.thresCount) {
          this.thresCount = this.callbackCount;
        } else {
          this.thresCount = Math.round(this.thresCount * 0.8 + this.callbackCount * 0.2);
        }
      }
      this.parameterConfig(); // 調整Node queue最大數量
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

  isChangeNodeAlgorithm(seqAndRssi) {
    var navshareFunc = this.navSharefunc;
    if (!this.once && seqAndRssi.length > 0) {
      var ansPosition = navshareFunc.getPointBySeqID(this.ansNav);
      var multiPosition = navshareFunc.getMultiLocationPoint(seqAndRssi);
      //多點定位和現在點的距離
      var dist = navshareFunc.getDistanceBetweenPoints(multiPosition, ansPosition);
      var nextN = navshareFunc.navSeqHashMap[this.ansNav].Next_N;
      var nextNodesize = nextN.length
    }


    if (this.once) {
      this.ansNav = seqAndRssi[0].seqId;
      console.info("-----Multi-First----- " + this.ansNav)
      return true;
    } else {
      //刷點條件
      if (!navshareFunc.arrayKeyContains(seqAndRssi, 'seqId', this.ansNav)) {
        if (seqAndRssi.length == 1) {
          this.ansNav = seqAndRssi[0].seqId;
          console.log("-----multi..searchAllEdge1..." + this.ansNav);
          return true;
        } else if (navshareFunc.navSeqHashMap[seqAndRssi[0].seqId].Next_N.includes("" + seqAndRssi[1].seqId) ||
          navshareFunc.navSeqHashMap[seqAndRssi[1].seqId].Next_N.includes("" + seqAndRssi[0].seqId)) {
          this.ansNav = seqAndRssi[0].seqId;
          console.log("-----multi..searchAllEdge2..." + this.ansNav);
          return true;
        }
        // console.log('刷點失敗')
      } else {
        let rankOfFirstNode = seqAndRssi[0].seqId;
        for (var i = 0; i < nextN.length; i++) {
          //多點定位和下一點距離
          var nextNodeLocateDis = navshareFunc.getDistanceBetweenPoints(multiPosition, navshareFunc.getPointBySeqID(nextN[i]))
          //多點定位和下下一點距離
          var next2NodeLocateDis = navshareFunc.getDistanceBetweenPoints(multiPosition,
            navshareFunc.getPointBySeqID(navshareFunc.navSeqHashMap[nextN[i]].Next_N[0]))
          if (navshareFunc.getTimestempDiff(this.switchTime) <= 5 && nextN[i] == rankOfFirstNode &&
            navshareFunc.n2nextNdis / (1 + 0.1 * nextNodesize) > nextNodeLocateDis) {
            this.ansNav = nextN[i];
            console.info("-----Multi-1----- " + nextN[i])
            return true;
          } else if (navshareFunc.getTimestempDiff(this.switchTime) > 5 && nextN[i] == rankOfFirstNode &&
            navshareFunc.n2nextNdis / (1.1 + 0.1 * nextNodesize) > nextNodeLocateDis) {
            this.ansNav = nextN[i];
            console.info("-----Multi-2----- " + nextN[i])
            return true;
          } else if (navshareFunc.n2nextNdis / 4 > nextNodeLocateDis) {
            this.ansNav = nextN[i];
            console.info("-----Multi-3----- " + nextN[i])
            return true;
          } else if (nextNodesize == 1 && navshareFunc.navSeqHashMap[nextN[i]].Next_N.length == 1 &&
            navshareFunc.navSeqHashMap[nextN[i]].Next_N[0] == rankOfFirstNode &&
            seqAndRssi[0].rssi > this.nowNodeValue['RSSI'] * 1.2 &&
            navshareFunc.arrayKeyContains(seqAndRssi, seqId, nextN[i])
          ) {
            if (navshareFunc.n2nextNdis * 1.3 > next2NodeLocateDis) {
              this.ansNav = nextN[i];
              console.info("-----Multi-4----- " + nextN[i])
              return true;
            }
          } else if (nextNodesize > 1 && rankOfFirstNode != this.ansNav &&
            navshareFunc.navSeqHashMap[nextN[i]].Next_N.includes(rankOfFirstNode) &&
            seqAndRssi[0].rssi > this.nowNodeValue['RSSI'] * 1.2) {
            next2NodeLocateDis = navshareFunc.getDistanceBetweenPoints(multiPosition,
              navshareFunc.getPointBySeqID(rankOfFirstNode))
            if (navshareFunc.n2nextNdis * 1.3 > next2NodeLocateDis) {
              this.ansNav = nextN[i];
              console.info("-----Multi-5----- " + nextN[i])
              return true;
            }
          }
        }
      }
    }
    return false;
  }


  startIndoorNavigation(ble) {
    var navshareFunc = this.navSharefunc;
    /*根據每秒callback數量對參數做調整 */

    if (this.changeFloorfunc.isChangeFloor(ble)) {
      this.changeFloorinit()
      console.info(this.changeFloorfunc.floorQueue)
      tmp = this.changeFloorfunc.floorQueue.filter(obj => {
        return obj.floor == nowFloor
      })
      tmp.forEach(function (item) {
        delete item['floor'];
        navQueue.push(item);
      });
      console.info(navQueue)
      this.changeFloorfunc.changeFloor()
    }

    if (this.preProcessBLE(ble) == false)
      return;

    if (navshareFunc.isLoadMap) {
      this.callbackCount++;
      navshareFunc.addBle2Queue(navQueue, ble, this.limitMaxQueueSize_Theshold); // 將收到的ble塞進navQueue
      var tmp = navshareFunc.mergeQueue2HashMap(navQueue);
      seqAndRssi = navshareFunc.sortByKey(tmp, 'RSSI'); // sort navQueue named seqAndRssi(以能量排名)
      if (this.ansNav != 0) {
        this.nowNodeValue = seqAndRssi.find(obj => {
          return obj.seqId == this.ansNav
        });
      }


      /*跳點邏輯 */
      if (navQueue.length >= this.limitMaxQueueSize_Theshold) {
        if (this.isChangeNodeAlgorithm(seqAndRssi) == true) {
          this.once = false;
          this.switchTime = Date.now();
          this.updateCurrentNode();
          console.log('Rank:', seqAndRssi);
          console.log('==================');
        }
      }

    }
  }


}