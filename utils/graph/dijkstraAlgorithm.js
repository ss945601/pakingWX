/**
 * 戴克斯特拉 最短路徑演算法
 * @author chieh
 * @version 2019/04/11
 */
var PriorityQueue = require('priorityQueue.js')
export class DijkstraAlgorithm {
  constructor(graph) {
    this.nodes = graph.nodes
    this.adjacencyList = graph.adjacencyList
  }
  findPathWithDijkstra(startNode, endNode) {
    let times = {};
    let backtrace = {};
    let pq = new PriorityQueue.PriorityQueue();
    times[startNode] = 0;

    this.nodes.forEach(node => {
      if (node !== startNode) {
        times[node] = Infinity
      }
    });
    pq.enqueue([startNode, 0]);
    while (!pq.isEmpty()) {
      let shortestStep = pq.dequeue();
      let currentNode = shortestStep[0];

      this.adjacencyList[currentNode].forEach(neighbor => {
        let time = times[currentNode] + neighbor.weight;
        if (time < times[neighbor.node]) {
          times[neighbor.node] = time;
          backtrace[neighbor.node] = currentNode;
          pq.enqueue([neighbor.node, time]);
        }
      });
    }
    let path = [endNode];
    let lastStep = endNode;

    while (lastStep !== startNode) {
      path.unshift(backtrace[lastStep])
      lastStep = backtrace[lastStep]
    }

    return path
  }
  changeCost(startNode, endNode, cost){
    if (objcontain(this.adjacencyList,startNode)){
      this.adjacencyList[startNode].forEach(function(item){
        if(item.node==endNode){
          item.weight = cost
          }})
    }
  }
  resetCost(){
    for (var propertyName in this.adjacencyList) {
      this.adjacencyList[propertyName].forEach(function (item) {
          item.weight = 1
      })
    }
  }
}
function objcontain(object, key) {
  return object ? hasOwnProperty.call(object, key) : false;
}