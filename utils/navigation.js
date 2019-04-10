export class IndoorFindSpace {
  /**
   * 初始化設定
   * @author Steven
   * @version 2019-04-03
   */
  constructor(appid) {
    this.init();
  }
  init() {
    console.log('初始化室內導航');
  }
  startIndoorNavigation(ble) {   
      var name = ble[0].name;
      var rssi = ble[0].RSSI;
      console.log(name, rssi);    
  }
} 
export const startIndoorNavigation = IndoorFindSpace.prototype.startIndoorNavigation;
