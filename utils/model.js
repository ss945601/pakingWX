var Navigation = require('../utils/navigation');
export class getDataFromDB {
  constructor() {
   
  }
  floorSensorHttpRequest(garageID) {
    let self = this;
    var res = ""; 
    wx.request({
      url: "http://000001RD.pakingtek.com/Local/local.php?page=get_floor_sensor_data_test",
      method: "post",
      data: {
        garage_id: '000001'
      },
      header: {
        "content-type": "application/x-www-form-urlencoded"
      },
      success: function({
        data
      }) {
        if (data.status == "success") {
          console.log('success');
          res = data.response;
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
}

export const floorSensorHttpRequest = getDataFromDB.prototype.floorSensorHttpRequest;
