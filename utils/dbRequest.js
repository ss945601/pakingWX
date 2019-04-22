var SensorDataModel = require('model/sensorDataModel.js')
export class getDataFromDB {
  constructor() {
    this.baseUrl = 'http://000001RD.pakingtek.com/Local/local.php?page='
  }
  floorSensorHttpRequest(garageID) {
    let self = this;
    var res = ""; 
    wx.request({
      url: this.baseUrl+"get_floor_sensor_data_test",
      method: "post",
      data: {
        garage_id: garageID
      },
      header: {
        "content-type": "application/x-www-form-urlencoded"
      },
      success: function({
        data
      }) {
        if (data.status == "success" ) {
          res = data.response;
          SensorDataModel.sensorInfo.Data = res;          
        } else {
          console.log(error.data.response);
        }
      },
      fail: function(error) {
        console.log(error);
      },
      complete: function() {
        // var timer = setTimeout(function() {
        //   self.floorSensorHttpRequest();
        // }, 2000);
      }
    })
    return res;
  }

  spaceSensorHttpRequest(garageID) {
    let self = this;
    var res = "";
    wx.request({
      url: this.baseUrl +"get_space_data_test",
      method: "post",
      data: {
        garage_id: garageID
      },
      header: {
        "content-type": "application/x-www-form-urlencoded"
      },
      success: function ({
        data
      }) {
        if (data.status == "success") {
          res = data.response;
          SensorDataModel.spaceInfo.Data = res;
        } else {
          console.log(error.data.response);
        }
      },
      fail: function (error) {
        console.log(error);
      },
      complete: function () {
        // var timer = setTimeout(function() {
        //   self.floorSensorHttpRequest();
        // }, 2000);
      }
    })
    return res;
  }

}

