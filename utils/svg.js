var Parser = require('../lib/xmldom/dom-parser')

/**
 * base64轉碼實現
 * @author Ray
 * @version 2019-04-03
 */
var Base64 = { _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (e) { var t = ""; var n, r, i, s, o, u, a; var f = 0; e = Base64._utf8_encode(e); while (f < e.length) { n = e.charCodeAt(f++); r = e.charCodeAt(f++); i = e.charCodeAt(f++); s = n >> 2; o = (n & 3) << 4 | r >> 4; u = (r & 15) << 2 | i >> 6; a = i & 63; if (isNaN(r)) { u = a = 64 } else if (isNaN(i)) { a = 64 } t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a) } return t }, decode: function (e) { var t = ""; var n, r, i; var s, o, u, a; var f = 0; e = e.replace(/\++[++^A-Za-z0-9+/=]/g, ""); while (f < e.length) { s = this._keyStr.indexOf(e.charAt(f++)); o = this._keyStr.indexOf(e.charAt(f++)); u = this._keyStr.indexOf(e.charAt(f++)); a = this._keyStr.indexOf(e.charAt(f++)); n = s << 2 | o >> 4; r = (o & 15) << 4 | u >> 2; i = (u & 3) << 6 | a; t = t + String.fromCharCode(n); if (u != 64) { t = t + String.fromCharCode(r) } if (a != 64) { t = t + String.fromCharCode(i) } } t = Base64._utf8_decode(t); return t }, _utf8_encode: function (e) { e = e.replace(/\r\n/g, "n"); var t = ""; for (var n = 0; n < e.length; n++) { var r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r) } else if (r > 127 && r < 2048) { t += String.fromCharCode(r >> 6 | 192); t += String.fromCharCode(r & 63 | 128) } else { t += String.fromCharCode(r >> 12 | 224); t += String.fromCharCode(r >> 6 & 63 | 128); t += String.fromCharCode(r & 63 | 128) } } return t }, _utf8_decode: function (e) { var t = ""; var n = 0; var r = c1 = c2 = 0; while (n < e.length) { r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r); n++ } else if (r > 191 && r < 224) { c2 = e.charCodeAt(n + 1); t += String.fromCharCode((r & 31) << 6 | c2 & 63); n += 2 } else { c2 = e.charCodeAt(n + 1); c3 = e.charCodeAt(n + 2); t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63); n += 3 } } return t } }

/**
 * SVG操作定義類
 */
export class SVGParser {

/**
 * 初始化設定
 * @author Ray
 * @version 2019-04-03
 */
  constructor(svg_xml) {
    this.doc = new Parser.DOMParser().parseFromString(svg_xml);
  }
 
 /**
  * 設定停車位狀態
  * @author Ray
  * @versio 2019-04-03
  */
  setParkingSpaceStatus (ids, colors) {
    SVGHandler.setParkingSpaceStatus(this.doc.documentElement.childNodes, ids, colors);
  }

  /**
   * 設置汽車定位點
   * @author Ray
   * @version 2019-04-09
   */
  setCarLocation (x, y) {
    SVGHandler.setCarLocation(this.doc.documentElement.childNodes, x, y);
  }

  /**
   * 設置步行定位點
   * @author Ray
   * @version 2019-04-09
   */
  setWalkerLocation(x, y) {
    SVGHandler.setWalkerLocation(this.doc.documentElement.childNodes, x, y);
  }

  /**
   * 取得base64編碼
   */
  getBase64Encode () {
    return Base64.encode(this.doc.toString());
  }
}

/**
 * SVG操作實現
 */
var SVGHandler = {
  setParkingSpaceStatus: function(nodes, ids, colors) {

    for (let i = 0; i < nodes.length; i++) {
      if ((nodes[i].nodeName == "rect" || nodes[i].nodeName == "polygon") && nodes[i].getAttribute("id").indexOf("p_") > -1) {
        for (let k = 0; k < ids.length; k++) {
          if (nodes[i].getAttribute("id").indexOf(ids[k]) > -1) {
            nodes[i].setAttribute("fill", colors[k]);
            break;
          }
        }
      }
      if (nodes[i].nodeName == "g" &&
        (nodes[i].getAttribute("id").indexOf("_main") > -1 || nodes[i].getAttribute("id").indexOf("p") > -1)) {
        this.setParkingSpaceStatus(nodes[i].childNodes, ids, colors);
      }
    }
  },

  /**
   * 設定汽車定位點
   * @author Ray
   * @version 2019-04-09
   */
  setCarLocation: function (nodes,x, y) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeName == "g" && nodes[i].getAttribute("id").indexOf("car_location") > -1) {
        nodes[i].setAttribute("transform", "translate(" + x + ", " + y + ")");
      }
      if (nodes[i].nodeName == "g" && nodes[i].getAttribute("id").indexOf("_main") > -1) {
        this.setCarLocation(nodes[i].childNodes, x, y);
      }
    }
  },

  /**
   * 設定步行定位點
   * @author Ray
   * @version 2019-04-09
   */
  setWalkerLocation: function (nodes, x, y) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeName == "g" && nodes[i].getAttribute("id").indexOf("walker_location") > -1) {
        nodes[i].setAttribute("transform", "translate(" + x + ", " + y + ")");
      }
      if (nodes[i].nodeName == "g" && nodes[i].getAttribute("id").indexOf("_main") > -1) {
        this.setWalkerLocation(nodes[i].childNodes, x, y);
      }
    }
  }
}
