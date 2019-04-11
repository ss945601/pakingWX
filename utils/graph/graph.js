/**
 * 
 * @author chieh
 * @version 2019/04/11
 */
export class Graph {
  constructor() {
    this.nodes = [];
    this.adjacencyList = {};
  }
  addNode(node) {
    this.nodes.push(node);
    this.adjacencyList[node] = [];
  }
  addEdge(node1, node2, weight) {
    this.adjacencyList[node1].push({ node: node2, weight: weight });
    // this.adjacencyList[node2].push({ node: node1, weight: weight });
  }
  getNodes(){
    return this.nodes
  }
  getEdge() {
    return this.adjacencyList
  }
}