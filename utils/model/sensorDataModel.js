var DbRequest = require('../dbRequest.js');
var dbr;
var sensorInfo = { 
  init:function(){
    dbr = new DbRequest.getDataFromDB();
    dbr.floorSensorHttpRequest("000001");
  },
  get Data() {
    return this._sensorData;
  },
  set Data(val) {
    this._sensorData = val;
  }
  
}
export {sensorInfo};



