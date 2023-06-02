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

const neo4j = require("neo4j-driver");
const neo4j_types = require("neo4j-driver/lib/graph-types");
const BaseClient = require("./client");

class Observer {
  constructor(session) {
    this.session = session;
    this.graph = { nodes: {}, edges: {}, pending: {} };
    this.rows = [];
    this.error = null;
  }

  convertInteger = (e) => {
    if (neo4j.types.Integer.inSafeRange(e)) {
      return e.toNumber();
    }
    return e.toString();
  };

  onNext = (record) => {
    var row = {};
    record.keys.forEach((key) => {
      var element = record.get(key);
      if (neo4j_types.isNode(element)) {
        row[key] = this.parseNode(element);
      } else if (neo4j_types.isRelationship(element)) {
        row[key] = this.parseRelationship(element);
      } else if (neo4j_types.isPath(element)) {
        row[key] = this.parsePath(element);
      } else if (Array.isArray(element)) {
        row[key] = this.parseArray(element);
      } else if (element instanceof neo4j.types.Integer) {
        row[key] = this.convertInteger(element);
      } else {
        row[key] = element;
      }
    });
    this.rows.push(row);
  };

  onCompleted = (summary) => {
    this.session.close().then(() => {});
  };

  onError = (error) => {
    this.error = error;
  };

  parsePropertiesToList = (element) => {
    if (typeof element.properties !== "object") {
      return undefined;
    }
    var properties = [{ name: "~id", value: element.identity.toString() }];
    Object.keys(element.properties).forEach((k) => {
      var value = element.properties[k].toString();
      properties.push({ name: k, value: value });
    });
    return properties;
  };

  parsePropertiesToMap = (element) => {
    if (typeof element.properties !== "object") {
      return undefined;
    }
    var properties = { "~id": element.identity.toString() };
    Object.keys(element.properties).forEach((k) => {
      var value = element.properties[k].toString();
      properties[k] = value;
    });
    return properties;
  };

  parseNode = (element) => {
    var node_id = element.identity.toString();
    var node = this.graph.nodes[node_id];
    if (node == undefined) {
      node = {
        id: node_id,
        label: element.labels[0],
        properties: this.parsePropertiesToMap(element),
      };
      this.graph.nodes[node.id] = node;
    }
    return node;
  };

  parseRelationship = (element) => {
    var rel_id = element.identity.toString();
    var rel = this.graph.edges[rel_id];
    if (rel == undefined) {
      var source = element.start.toString();
      var target = element.end.toString();
      rel = {
        id: rel_id,
        label: element.type,
        source: source,
        target: target,
        properties: this.parsePropertiesToMap(element),
      };
      // check if element.start & element.end exists
      if (this.graph.nodes[source] == undefined) {
        this.graph.pending[source] = true;
      }
      if (this.graph.nodes[target] == undefined) {
        this.graph.pending[target] = true;
      }
      this.graph.edges[rel.id] = rel;
    }
    return rel;
  };

  parsePath = (path) => {
    var current = path.start.identity;
    var s = path.start.toString();
    path.segments.forEach((seg) => {
      this.parseNode(seg.start);
      this.parseRelationship(seg.relationship);
      this.parseNode(seg.end);
      var relationshipStr = seg.relationship.identity.toString() + ":" + seg.relationship.type;
      if (seg.start.identity == current) {
        s += "-[" + relationshipStr + "]->" + seg.end.toString();
      } else {
        s += "<-[" + relationshipStr + "]-" + seg.end.toString();
      }
    });
    return s;
  };

  parseArray = (array) => {
    var result = [];
    array.forEach((e) => {
      if (neo4j_types.isNode(e)) {
        result.push(this.parseNode(e));
      } else if (neo4j_types.isRelationship(e)) {
        result.push(this.parseRelationship(e));
      } else if (neo4j_types.isPath(e)) {
        result.push(this.parsePath(e));
      } else if (e instanceof neo4j.types.Integer) {
        result.push(this.convertInteger(e));
      } else {
        result.push(e);
      }
    });
    return result;
  };

  nodeToString = (node) => {};

  relationshipToString = () => {};
}

class CypherClient extends BaseClient {
  constructor(endpoint, username, password) {
    super();
    this.client = neo4j.driver(endpoint, neo4j.auth.basic(username, password));
  }

  open() {}

  run = async function (query, bindings) {
    const session = this.client.session();
    var observer = new Observer(session);
    await session
      .run(query, bindings)
      .then((results) => {
        results.records.forEach((record) => {
          observer.onNext(record);
        });
      })
      .catch((error) => {
        observer.onError(error);
      });
    session.close();
    if (observer.error != null) {
      throw { status: -1, msg: observer.error.message };
    }
    var graph = {
      nodes: Object.values(observer.graph.nodes),
      edges: Object.values(observer.graph.edges),
    };
    Object.keys(observer.graph.pending).forEach((key) => {
      if (observer.graph.nodes[key] == undefined) {
        // add a node as placeholder
        graph.nodes.push({ id: key, label: "", properties: {} });
      }
    });
    return { graph: graph, rows: observer.rows };
  };

  close() {
    return this.client.close();
  }
}

module.exports = CypherClient;
