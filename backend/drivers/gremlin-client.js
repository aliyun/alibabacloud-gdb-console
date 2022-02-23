/*
 * MIT License
 *
 * Copyright (c) 2022 Alibaba Cloud
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const gremlin = require("gremlin");
const BaseClient = require("./client");

class GremlinClient extends BaseClient {
  constructor(endpoint, username, password) {
    super();
    const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(username, password);

    this.client = new gremlin.driver.Client(endpoint, {
      authenticator,
    });
  }

  open() {
    return this.client.open();
  }

  run = async function (query, bindings) {
    const timeout = new Promise((res) => setTimeout(() => res(undefined), 10000));
    try {
      const result = await Promise.race([this.client.submit(query, bindings), timeout]);
      if (result === undefined) {
        throw "request timeout";
      }
      let writer = new gremlin.structure.io.GraphSONWriter();
      // return { graph: this.parse(result), raw: writer.adaptObject(result.toArray()) };
      return this.parse(result);
    } catch (error) {
      console.log("error:", error);
      var result = { status: -1, msg: "" + error };
      if (typeof error === "object") {
        if ("statusCode" in error) {
          result.status = error.statusCode;
        }
        if (error.statusAttributes instanceof Map && error.statusAttributes.has("stackTrace")) {
          result.msg = error.statusAttributes.get("stackTrace");
        }
      }
      throw result;
    }
  };

  close() {
    return this.client.close();
  }

  parse = (result) => {
    var graph = {
      nodes: {},
      edges: {},
      pending: {},
    };
    var rows = [];
    for (const element of result) {
      let row = this.parseElement(graph, element);
      // rows.push(JSON.stringify(row));
      rows.push(row);
    }

    // add placeholders for missing vertices to draw the graph
    Object.keys(graph.pending).forEach((nodeId) => {
      if (graph.nodes[nodeId] == undefined) {
        graph.nodes[nodeId] = graph.pending[nodeId];
      }
    });

    return {
      graph: {
        nodes: Object.values(graph.nodes),
        edges: Object.values(graph.edges),
      },
      rows: rows,
    };
  };

  parseElement = (graph, element) => {
    if (element instanceof gremlin.structure.Vertex) {
      return this.parseVertex(graph, element);
    } else if (element instanceof gremlin.structure.Edge) {
      return this.parseEdge(graph, element);
    } else if (element instanceof gremlin.structure.Path) {
      return this.parsePath(graph, element);
    } else if (element instanceof Map) {
      return this.parseMap(graph, element);
    } else if (element instanceof Array) {
      return this.parseArray(graph, element);
    } else if (element instanceof gremlin.structure.VertexProperty) {
      return { key: element.key, value: element.value };
    } else if (element instanceof gremlin.structure.Property) {
      return { key: element.key, value: element.value };
    }

    return element;
  };

  parseVertex = (graph, vertex) => {
    if (graph.nodes[vertex.id] == undefined) {
      graph.nodes[vertex.id] = {
        id: vertex.id,
        label: vertex.label,
        properties: this.propertiesToMap(vertex),
      };
    }
    return graph.nodes[vertex.id];
  };

  parseEdge = (graph, edge) => {
    if (graph.edges[edge.id] == undefined) {
      graph.edges[edge.id] = {
        id: edge.id,
        label: edge.label,
        source: edge.outV.id,
        target: edge.inV.id,
        properties: this.propertiesToMap(edge),
      };
    }
    if (graph.nodes[edge.outV.id] == undefined && graph.pending[edge.outV.id] == undefined) {
      graph.pending[edge.outV.id] = {
        id: edge.outV.id,
        label: edge.outV.label,
      };
    }
    if (graph.nodes[edge.inV.id] == undefined && graph.pending[edge.inV.id] == undefined) {
      graph.pending[edge.inV.id] = {
        id: edge.inV.id,
        label: edge.inV.label,
      };
    }
    return graph.edges[edge.id];
  };

  parsePath = (graph, element) => {
    var path = [];
    for (const obj of element.objects) {
      if (obj instanceof gremlin.structure.Vertex) {
        path.push(this.parseVertex(graph, obj));
      } else if (obj instanceof gremlin.structure.Edge) {
        path.push(this.parseEdge(graph, obj));
      } else {
        // skip other types
        console.log(obj.constructor.toString());
      }
    }
    return path;
  };

  parseMap = (graph, element) => {
    var map = {};
    for (let [key, value] of element) {
      // let parsedKey = this.parseElement(graph, key);
      map[key] = this.parseElement(graph, value);
    }
    return map;
  };

  parseArray = (graph, array) => {
    var a = [];
    for (let i in array) {
      let e = this.parseElement(graph, array[i]);
      a.push(e);
    }
    return a;
  };

  propertiesToList = (element) => {
    var properties = [];
    if (element.properties != undefined) {
      for (const key in element.properties) {
        const property = element.properties[key];
        if (property instanceof Array) {
          // vertex property
          for (const p of property) {
            properties.push({ name: p.label, value: p.value });
          }
        } else {
          // edge property
          properties.push({ name: key, value: property });
        }
      }
    }
    return properties;
  };

  // FIXME: 多值属性如何处理?
  propertiesToMap = (element) => {
    if (element.properties === undefined) {
      return undefined;
    }
    // properties = { "~id": element.id };
    let properties = {};
    for (const key in element.properties) {
      const property = element.properties[key];
      if (property instanceof Array) {
        // vertex property
        // 这里暂时不考虑多值属性，只取第一个value
        if (property.length > 0) {
          properties[property[0].label] = property[0].value;
        }
        // for (const p of property) {
        //   properties[p.label] = p.value;
        // }
      } else {
        // edge property
        properties[key] = property;
      }
    }
    return properties;
  };
}

module.exports = GremlinClient;
