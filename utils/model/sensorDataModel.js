var DbRequest = require('../dbRequest.js');
var dbr;
var sensorInfo = { 
  init:function(post){
    dbr = new DbRequest.getDataFromDB();
    dbr.floorSensorHttpRequest(post);
  },
  get Data() {
    return this._sensorData;
  },
  set Data(val) {
    this._sensorData = val;
  }
  
}

var spaceInfo = {
  init: function (post) {
    dbr = new DbRequest.getDataFromDB();
    dbr.spaceSensorHttpRequest(post);
  },
  get Data() {
    return this._spaceData;
  },
  set Data(val) {
    this._spaceData = val;
  }

}

export {sensorInfo, spaceInfo};



