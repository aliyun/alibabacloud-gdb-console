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

/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-empty */
/* eslint-disable react/sort-comp */
/* eslint-disable max-len */

import React, { useLayoutEffect } from "react";
import PropTypes from "prop-types";
import G6 from "@antv/g6";
import Defaults from "../../utils/Defaults";

import "./index.css";

class GraphVis extends React.Component {
  static defaultProps = {
    style: {},
    defaultGraphData: {
      nodes: [],
      edges: [],
    },
    nodeVisOptions: {},
    edgeVisOptions: {},

    // callback
    getNodePropertyCallback: null,
    getEdgePropertyCallback: null,
    showPropertyCallback: null,
    getOutEdgesCallback: null,
    graphChangedCallback: null,
  };

  constructor(props) {
    super(props);
    this.appRef_ = React.createRef();

    // label
    this.autoShowProperty_ = true;

    // for graph
    this.graph_ = null;
    this.colorIndex_ = 0;
    this.labelColor_ = {};
    this.autoShowPropertyTaskCount_ = 0;
  }

  componentDidMount() {
    const contextMenu = new G6.Menu({
      getContent(_) {
        const outDiv = document.createElement("div");
        outDiv.style.width = "160px";
        outDiv.innerHTML = `<ul class="context-menu-content">
            <li class="context-menu-item" value="out">加载一度邻居(OUT)</li>
            <li class="context-menu-item" value="in">加载一度邻居(IN)</li>
          </ul>`;
        return outDiv;
      },
      handleMenuClick: (target, item) => {
        const value = target.getAttribute("value");
        if (item.get("type") === "edge") {
          return;
        }
        if (value === "out") {
          this.LoadingOutEAction(item.getModel().id.substring(2), true);
        } else {
          this.LoadingOutEAction(item.getModel().id.substring(2), false);
        }
      },
      itemTypes: ["node"],
      offsetX: 16,
      offsetY: 0,
    });

    this.graph_ = new G6.Graph({
      container: this.appRef_.current,
      groupByTypes: false,
      linkCenter: false,
      layout: Defaults.layoutOptions.random,
      nodeStateStyles: {
        // 鼠标 hover 上节点，即 hover 状态为 true 时的样式
        hover: {
          stroke: "steelblue",
          lineWidth: 2,
        },
        // 鼠标点击节点，即 click 状态为 true 时的样式
        selected: {
          fill: "lightsteelblue",
          stroke: "steelblue",
          lineWidth: 2,
        },
        focused: {
          shadowColor: "rgba(0, 255, 255, 1)",
          shadowBlur: 60,
        },
      },
      defaultNode: Defaults.nodeStyles.circle,
      defaultEdge: Defaults.edgeStyles.line,
      edgeStateStyles: {
        // 鼠标 hover 上边，即 hover 状态为 true 时的样式
        hover: {
          stroke: "slategray",
          lineWidth: 2,
        },
        // 鼠标点击边，即 selected 状态为 true 时的样式
        selected: {
          stroke: "darkslategray",
          lineWidth: 2,
        },
        focused: {
          shadowColor: "rgba(0, 255, 255, 1)",
          shadowBlur: 40,
        },
      },
      modes: {
        default: ["drag-canvas", "zoom-canvas", "drag-node"],
      },
      plugins: [contextMenu],
    });

    this.setEvents(this.graph_);
    // set default layout
    this.graph_.updateLayout(Defaults.defaultLayout());
  }

  getColor() {
    // eslint-disable-next-line no-plusplus
    return Defaults.colors[this.colorIndex_++ % Defaults.colors.length];
  }

  getColorByLabel(label) {
    if (label in this.labelColor_) {
      return this.labelColor_[label];
    }
    const color = this.getColor();
    this.labelColor_[label] = color;
    return color;
  }

  getNodeOptions(node) {
    const options = this.props.nodeVisOptions[node.label];
    if (node.settings === undefined) {
      return options;
    }
    if (options === undefined) {
      return node.settings;
    }

    return { ...options, ...node.settings };
  }

  getEdgeOptions(edge) {
    const options = this.props.edgeVisOptions[edge.label];
    if (edge.settings === undefined) {
      return options;
    }
    if (options === undefined) {
      return edge.settings;
    }

    return { ...options, ...edge.settings };
  }

  getControlPoints(x1, y1, x2, y2, d) {
    const midx = (x1 + x2) / 2;
    const midy = (y1 + y2) / 2;

    const Dx = x2 - x1;
    const Dy = y2 - y1;
    const D = Math.sqrt(Math.pow(Dx, 2) + Math.pow(Dy, 2));
    const dy = (Dx * d) / D;
    const dx = (Dy * d) / D;

    return [{ x: midx + dx, y: midy - dy }];
  }

  getOverlappedEdges() {
    // map src#target to edge
    let edges = {};
    this.graph_.getEdges().forEach((e) => {
      const edge = e.getModel();
      const key = `${edge.source}#${edge.target}`;
      if (key in edges) {
        edges[key].push(e);
      } else {
        edges[key] = [e];
      }
    });

    return edges;
  }

  resetOverlappedEdges() {
    const edges = this.getOverlappedEdges();

    for (const [key, edge_list] of Object.entries(edges)) {
      if (edge_list.length <= 1) {
        continue;
      }
      let offset = 7.5;
      let increaseOffset = false;
      for (const e of edge_list) {
        const edge = e.getModel();
        this.graph_.updateItem(e, {
          type: "quadratic",
          controlPoints: this.getControlPoints(
            edge.startPoint.x,
            edge.startPoint.y,
            edge.endPoint.x,
            edge.endPoint.y,
            offset
          ),
        });
        offset = -offset;
        if (increaseOffset) {
          offset = offset > 0 ? offset + 15 : offset - 15;
        }
        increaseOffset = !increaseOffset;
      }
    }
  }

  mergeNodesAndEdges(graphData) {
    const newNodes = [];
    const newEdges = [];
    const nodesMissingProperties = [];
    const edgesMissingProperties = [];
    graphData.nodes.forEach((node) => {
      const id = "V$" + node.id;
      if (!this.graph_.findById(id)) {
        const options = this.getNodeOptions(node);
        let new_node = {
          ...node,
          id: id,
          realId: node.id,
          realLabel: node.label,
        };
        if (options) {
          const style = this.getNodeStyleFromOptions(new_node, options, nodesMissingProperties);
          Object.assign(new_node, style);
        }
        this.graph_.addItem("node", new_node);
        newNodes.push(node);
      }
    });
    graphData.edges.forEach((edge) => {
      const id = "E$" + edge.id;
      if (!this.graph_.findById(id)) {
        const options = this.getEdgeOptions(edge);
        let new_edge = {
          ...edge,
          id: id,
          realId: edge.id,
          realLabel: edge.label,
          source: "V$" + edge.source,
          target: "V$" + edge.target,
        };
        if (options) {
          const style = this.getEdgeStyleFromOptions(new_edge, options, edgesMissingProperties);
          Object.assign(new_edge, style);
        }
        this.graph_.addItem("edge", new_edge);
        newEdges.push(edge);
      }
    });

    if (newNodes.length > 0 || newEdges.length > 0) {
      this.graph_.layout();
      if (this.autoShowProperty_) {
        this.getAllProperties(nodesMissingProperties, edgesMissingProperties);
      }
    }

    return {
      nodes: newNodes,
      edges: newEdges,
    };
  }

  resizeNodesSizeByEdgesCount(labels) {
    if (this.graph_ == null) {
      return;
    }
    let minEdgesCount = Number.MAX_VALUE;
    let maxEdgesCount = 0;
    this.graph_.find("node", (nodeItem) => {
      const node = nodeItem.getModel();
      if (!labels.has(node.realLabel)) {
        return;
      }
      const count = this.graph_.getNeighbors(node.id).length;
      if (minEdgesCount > count) {
        minEdgesCount = count;
      }
      if (maxEdgesCount < count) {
        maxEdgesCount = count;
      }
    });
    const nodeSizeStep = parseFloat(
      (Defaults.autoNodeSizeMax - Defaults.autoNodeSizeMin) / (maxEdgesCount - minEdgesCount),
      10
    );
    this.graph_.find("node", (nodeItem) => {
      let node = nodeItem.getModel();
      if (!labels.has(node.realLabel)) {
        return;
      }
      const { length } = this.graph_.getNeighbors(node.id);
      const size = Defaults.autoNodeSizeMin + nodeSizeStep * (length - minEdgesCount);
      if (size <= Defaults.autoNodeSizeMax && size >= Defaults.autoNodeSizeMin) {
        node.size = size;
        this.graph_.updateItem(nodeItem, node);
      }
    });
  }

  resizeNodeByPropertyName(labels) {
    if (this.graph_ == null) {
      return;
    }
    let minWeight = Number.MAX_VALUE;
    let maxWeight = 0;
    this.graph_.find("node", (item) => {
      let node = item.getModel();
      if (!(node.realLabel in labels)) {
        return;
      }
      const propertyName = labels[node.realLabel];
      if (node.properties !== undefined && propertyName in node.properties) {
        try {
          const weight = parseFloat(node.properties[propertyName]);
          if (minWeight > weight) {
            minWeight = weight;
          }
          if (maxWeight < weight) {
            maxWeight = weight;
          }
        } catch (err) {}
      }
    });
    const nodeSizeStep = parseFloat(
      (Defaults.autoNodeSizeMax - Defaults.autoNodeSizeMin) / (maxWeight - minWeight),
      10
    );
    this.graph_.find("node", (item) => {
      let node = item.getModel();
      if (!(node.realLabel in labels)) {
        return;
      }
      const propertyName = labels[node.realLabel];
      if (node.properties !== undefined && propertyName in node.properties) {
        try {
          const weight = parseFloat(node.properties[propertyName]);
          const size = parseInt(Defaults.autoNodeSizeMin + nodeSizeStep * (weight - minWeight));
          if (size <= Defaults.autoNodeSizeMax && size >= Defaults.autoNodeSizeMin) {
            node.size = size;
            this.graph_.updateItem(item, node, false);
          }
        } catch (err) {}
      }
    });
  }

  resetAllNodesDefaultSize() {
    this.graph_.find("node", (item) => {
      let node = item.getModel();
      node.size = Defaults.nodeSize;
      this.graph_.updateItem(item, node, false);
    });
  }

  resizeAllNodes() {
    let resizeByEdges = new Set();
    let resizeByProperty = {};
    for (const [label, settings] of Object.entries(this.props.nodeVisOptions)) {
      if (settings.nodeSize === undefined || settings.nodeSize === "autoResizeDisabled") {
        continue;
      }
      if (settings.nodeSize === "autoResizeByEdgesCount") {
        resizeByEdges.add(label);
      } else if (settings.nodeSize === "autoResizeByProperty" && settings.autoResizePropertyName !== "") {
        resizeByProperty[label] = settings.autoResizePropertyName;
      }
    }
    if (resizeByEdges.size > 0) {
      this.resizeNodesSizeByEdgesCount(resizeByEdges);
    }
    if (Object.keys(resizeByProperty).length > 0) {
      this.resizeNodeByPropertyName(resizeByProperty);
    }
  }

  checkItemShowName(item, properties, nameDict) {
    if (item.label in nameDict) {
      const propertyKey = nameDict[item.label];
      if (propertyKey in properties) {
        item.realLabel = item.label;
        item.label = properties[propertyKey];
      }
    }
    return item;
  }

  showNodePropertyAction(item) {
    if (this.props.getNodePropertyCallback) {
      const node = item.getModel();
      const realId = node.id.substring(2);
      if (typeof node.properties === "object") {
        this.props.showPropertyCallback("vertex", realId, node.realLabel, node.properties);
        return;
      }
      this.props.getNodePropertyCallback([realId], (_, properties) => {
        if (this.props.showPropertyCallback) {
          this.props.showPropertyCallback("vertex", realId, node.realLabel, this.propertiesToObject(properties[0]));
        }
      });
    }
  }

  showEdgePropertyAction(item) {
    if (this.props.getEdgePropertyCallback) {
      const edge = item.getModel();
      const realId = edge.id.substring(2);
      if (typeof edge.properties === "object" && Object.keys(edge.properties).length > 0) {
        this.props.showPropertyCallback("edge", realId, edge.realLabel, edge.properties);
        return;
      }
      this.props.getEdgePropertyCallback([realId], (_, properties) => {
        if (this.props.showPropertyCallback) {
          this.props.showPropertyCallback("edge", realId, edge.realLabel, properties[0]);
        }
      });
    }
  }

  LoadingOutEAction(id, isOut) {
    if (this.props.getOutEdgesCallback) {
      this.props.getOutEdgesCallback(id, isOut, (graphData) => {
        const mergeResult = this.mergeNodesAndEdges(graphData);
        this.resizeAllNodes();
        if (this.props.graphChangedCallback) {
          this.props.graphChangedCallback(this.getGraphTextData());
        }
        return mergeResult;
      });
    }
  }

  mergeNode(id, node) {
    const item = this.graph_.findById("V$" + id);
    if (item === null) {
      console.log(`node ${id} not found`);
      return;
    }

    const model = item.getModel();
    const settings = this.props.nodeVisOptions[model.realLabel];
    if (settings !== undefined) {
      // update label if needed
      if (settings.text === "property" && settings.textValue !== "" && typeof node.properties === "object") {
        if (settings.textValue in node.properties) {
          node.label = node.properties[settings.textValue];
        }
      }
      // TODO: update size if needed
    }
    this.graph_.updateItem(item, node);
  }

  mergeEdge(id, edge) {
    const item = this.graph_.findById("E$" + id);
    if (item === null) {
      console.log(`edge ${id} not found`);
      return;
    }
    const model = item.getModel();
    const settings = this.props.edgeVisOptions[model.realLabel];
    if (settings !== undefined) {
      // update label if needed
      if (settings.text === "property" && settings.textValue !== "" && typeof edge.properties === "object") {
        if (settings.textValue in edge.properties) {
          edge.label = edge.properties[settings.textValue];
        }
      }
    }
    this.graph_.updateItem(item, edge);
  }

  propertiesToObject(properties) {
    let obj = {};
    for (const p of properties) {
      if (!(p.key in obj)) {
        obj[p.key] = p.value;
      }
    }
    return obj;
  }

  getAllProperties(nodeIds, edgeIds) {
    if (nodeIds.length > 0 && this.props.getNodePropertyCallback) {
      this.props.getNodePropertyCallback(nodeIds, (nodeIds, properties) => {
        for (const i in nodeIds) {
          this.mergeNode(nodeIds[i], { properties: this.propertiesToObject(properties[i]) });
        }
        // resize nodes
        this.resizeAllNodes();
      });
    }
    if (edgeIds.length > 0 && this.props.getEdgePropertyCallback) {
      this.props.getEdgePropertyCallback(edgeIds, (edgeIds, properties) => {
        for (const i in edgeIds) {
          this.mergeEdge(edgeIds[i], { properties: properties[i] });
        }
      });
    }
  }

  clearFocused() {
    const focusedNodes = this.graph_.findAllByState("node", "focused");
    focusedNodes.forEach((item) => {
      this.graph_.setItemState(item, "focused", false);
    });
    const focusedEdges = this.graph_.findAllByState("edge", "focused");
    focusedEdges.forEach((item) => {
      this.graph_.setItemState(item, "focused", false);
    });
  }

  searchKeywordInItem(items, keyword) {
    const founds = [];
    items.forEach((item) => {
      if (item.isVisible()) {
        let model = item.getModel();
        if (model.id === keyword) {
          founds.push(item.id);
        }
        let label = "";
        if ("label" in model) {
          label = "realLabel" in model ? model.realLabel : model.label;
          if (label === keyword) {
            founds.push(model.id);
          }
        }
        if ("properties" in model) {
          for (const key in model.properties) {
            if (key === keyword || model.properties[key] === keyword) {
              founds.push(model.id);
            }
          }
        }
      }
    });

    return founds;
  }

  getEdgePosition(id) {
    let position = {};
    if (this.graph_.body.edges[id] !== undefined) {
      const { from } = this.graph_.body.edges[id];
      const { to } = this.graph_.body.edges[id];
      position = {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
      };
    }
    return position;
  }

  setItemsHidden(items, label, hidden) {
    items.forEach((item) => {
      let model = item.getModel();
      const itemLabel = "realLabel" in model ? model.realLabel : model.label;
      if (itemLabel === label) {
        item.changeVisibility(!hidden);
      }
    });
  }

  setAllItemsHidden(items, hidden) {
    items.forEach((item) => {
      item.changeVisibility(!hidden);
    });
  }

  /**
   * 在图上放大并移动某个点或边到图的中心
   * @param id {String}
   */
  focusNodeOrEdge(id) {
    this.clearFocused();
    const item = this.graph_.findById(id);
    if (item === undefined) {
      return;
    }
    this.graph_.focusItem(item, true);
    this.graph_.setItemState(item, "focused", true);
    if (item.getType() === "node") {
      this.showNodePropertyAction(item);
    } else {
      this.showEdgePropertyAction(item);
    }
  }

  layout() {
    this.graph_.layout();
  }

  /**
   * 从搜索放大中恢复原始大小
   */
  zoomExtends() {
    this.graph_.fitView(100);
  }

  fitCenter() {
    this.graph_.fitCenter();
    // const z = this.graph_.getZoom();
    // this.graph_.zoom(z, { x: 0, y: 0 });
  }

  /**
   * 在图中搜索并返回相关节点和边的ID
   * @param keyword {string}
   * @returns {{nodes: Array, edges: Array}}
   */
  searchNodeAndEdge(keyword) {
    return {
      nodes: this.searchKeywordInItem(this.graph_.getNodes(), keyword),
      edges: this.searchKeywordInItem(this.graph_.getEdges(), keyword),
    };
  }

  /**
   * 设置相关 Label 的点的隐藏属性
   * @param {string} label
   * @param {bool} hidden
   */
  setNodesHidden(label, hidden) {
    this.setItemsHidden(this.graph_.getNodes(), label, hidden);
  }

  /**
   * 设置相关 Label 的边的隐藏属性
   * @param {string} label
   * @param {bool} hidden
   */
  setEdgesHidden(label, hidden) {
    this.setItemsHidden(this.graph_.getEdges(), label, hidden);
  }

  /**
   * 设置所有点的隐藏属性
   * @param {bool} hidden
   */
  setAllNodesHidden(hidden) {
    this.setAllItemsHidden(this.graph_.getNodes(), hidden);
  }

  /**
   * 设置所有边的隐藏属性
   * @param {bool} hidden
   */
  setAllEdgesHidden(hidden) {
    this.setAllItemsHidden(this.graph_.getEdges(), hidden);
  }

  /**
   * 获得图的节点和边 JSON 格式信息
   * @returns {{nodes: Array, edges: Array}}
   */
  getGraphTextData() {
    const nodes = [];
    this.graph_.find("node", (nodeItem) => {
      const node = nodeItem.getModel();
      if (!node.hidden) {
        let label = "";
        if ("label" in node) {
          label = "realLabel" in node ? node.realLabel : node.label;
        }
        if ("properties" in node) {
          nodes.push({
            id: node.id.substring(2),
            label,
            properties: node.properties,
          });
        } else {
          nodes.push({
            id: node.id.substring(2),
            label,
          });
        }
      }
    });

    const edges = [];
    this.graph_.find("edge", (edgeItem) => {
      const edge = edgeItem.getModel();
      if (!edge.hidden) {
        let label = "";
        if ("label" in edge) {
          label = "realLabel" in edge ? edge.realLabel : edge.label;
        }
        if ("properties" in edge) {
          edges.push({
            id: edge.id.substring(2),
            source: edge.source.substring(2),
            target: edge.target.substring(2),
            label,
            properties: edge.properties,
          });
        } else {
          edges.push({
            id: edge.id.substring(2),
            source: edge.source.substring(2),
            target: edge.target.substring(2),
            label,
          });
        }
      }
    });

    return { nodes, edges };
  }

  setEvents(graph) {
    graph.on("afterlayout", () => {
      graph.fitCenter();
      this.resetOverlappedEdges();
    });
    graph.on("dragnodeend", (nodes) => {
      this.resetOverlappedEdges();
    });
    // 鼠标进入节点
    graph.on("node:mouseenter", (e) => {
      graph.setItemState(e.item, "hover", true); // 设置当前节点的 hover 状态为 true
    });

    // 鼠标离开节点
    graph.on("node:mouseleave", (e) => {
      graph.setItemState(e.item, "hover", false); // 设置当前节点的 hover 状态为 false
      // FIXME: 这里不知道为什么，鼠标离开后会留下边框，必须重设一下lineWidth
      graph.updateItem(e.item, { style: { lineWidth: 0 } });
    });

    const clearSelected = () => {
      // 先将所有当前是 selected 状态的节点置为非 selected 状态
      const selectedNodes = graph.findAllByState("node", "selected");
      selectedNodes.forEach((cn) => {
        graph.setItemState(cn, "selected", false);
        // FIXME: 这里不知道为什么，鼠标离开后会留下边框，必须重设一下lineWidth
        graph.updateItem(cn, { style: { lineWidth: 0 } });
      });
      const selectedEdges = graph.findAllByState("edge", "selected");
      selectedEdges.forEach((cn) => {
        graph.setItemState(cn, "selected", false);
      });
    };

    // 点击画布
    graph.on("click", (evt) => {
      clearSelected();
    });

    // 节点点击
    graph.on("node:click", (e) => {
      clearSelected();
      const nodeItem = e.item; // 获取被点击的节点元素对象
      graph.setItemState(nodeItem, "selected", true); // 设置当前节点的 click 状态为 true
      // 在侧边栏显示详细信息
      if (this.props.showPropertyCallback != null) {
        this.showNodePropertyAction(nodeItem);
      }
    });

    // 节点拖拽
    // graph.on("node:dragstart", function (e) {
    //   const model = e.item.get("model");
    //   model.fx = e.x;
    //   model.fy = e.y;
    // });
    // graph.on("node:dragend", function (e) {
    //   const model = e.item.get("model");
    //   model.fx = null;
    //   model.fy = null;
    // });
    graph.on("node:drag", function (e) {
      // if (graph.get("layout").type === "force") {
      //   graph.layout();
      // }
      const model = e.item.get("model");
      model.fx = e.x;
      model.fy = e.y;
    });

    // 边事件
    graph.on("edge:mouseenter", (e) => {
      const edgeItem = e.item; // 获取鼠标进入的节点元素对象
      graph.setItemState(edgeItem, "hover", true); // 设置当前节点的 hover 状态为 true
    });

    graph.on("edge:mouseleave", (e) => {
      const edgeItem = e.item; // 获取鼠标离开的节点元素对象
      graph.setItemState(edgeItem, "hover", false); // 设置当前节点的 hover 状态为 false
    });

    graph.on("edge:click", (e) => {
      clearSelected();
      const edgeItem = e.item; // 获取被点击的节点元素对象
      graph.setItemState(edgeItem, "selected", true); // 设置当前节点的 selected 状态为 true
      // 在侧边栏显示详细信息
      if (this.props.showPropertyCallback != null) {
        this.showEdgePropertyAction(edgeItem);
      }
    });

    // 右键点击显示上下文菜单
    graph.on("node:contextmenu", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      clearSelected();
      const item = evt.item; // 获取被点击的节点元素对象
      graph.setItemState(item, "selected", true); // 设置当前节点的 selected 状态为 true
    });
  }

  changeLayout(layout) {
    if (layout in Defaults.layoutOptions) {
      this.graph_.updateLayout(Defaults.layoutOptions[layout]);
    }
  }

  applyNodeSettings(label, settings) {
    const nodes = this.graph_.getNodes();
    const nodesMissingProperties = [];
    for (const item of nodes) {
      const node = item.getModel();
      if ("realLabel" in node) {
        if (node.realLabel !== label) {
          continue;
        }
      } else if (node.label !== label) {
        continue;
      }

      const style = this.getNodeStyleFromOptions(node, settings, nodesMissingProperties);
      this.graph_.updateItem(item, style);
      if (nodesMissingProperties.length > 0) {
        this.getAllProperties(nodesMissingProperties, []);
      }
    }
  }

  applyEdgeSettings(label, settings) {
    const edges = this.graph_.getEdges();
    let edgesMissingProperties = [];
    for (const item of edges) {
      const edge = item.getModel();
      if ("realLabel" in edge) {
        if (edge.realLabel !== label) {
          continue;
        }
      } else if (edge.label !== label) {
        continue;
      }

      const style = this.getEdgeStyleFromOptions(edge, settings, edgesMissingProperties);
      this.graph_.updateItem(item, style);
      if (edgesMissingProperties.length > 0) {
        this.getAllProperties([], edgesMissingProperties);
      }
    }
  }

  getNodeStyleFromOptions(node, options, nodesMissingProperties) {
    let added = false;
    // shape
    let shapeStyle = Defaults.nodeStyles[options.nodeShape];
    if (shapeStyle === undefined) {
      shapeStyle = Defaults.nodeStyles.circle;
    }
    let new_node = { type: shapeStyle.type, style: { ...shapeStyle.style } };

    // TODO: image
    if (options.nodeShape === "image") {
      if (options.nodeImageType === "imageUrl") {
        if (options.nodeImageUrl.length > 0) {
          new_node.img = options.nodeImageUrl;
        }
      } else {
        if (options.nodeImageProp.length > 0) {
          if (typeof node.properties === "object") {
            if (options.nodeImageProp in node.properties) {
              new_node.img = node.properties[options.nodeImageProp];
            } else {
              new_node.img = "";
            }
          } else {
            nodesMissingProperties.push(node.id.substring(2));
            added = true;
          }
        }
      }
    }

    // text
    if (options.text) {
      if (options.text === "label") {
        new_node.label = node.realLabel;
      } else if (options.text === "id") {
        new_node.label = node.realId;
      } else if (options.text === "property") {
        if (typeof node.properties === "object") {
          if (options.textValue in node.properties) {
            new_node.label = node.properties[options.textValue];
          } else {
            new_node.label = "N/A";
          }
        } else {
          if (!added) {
            nodesMissingProperties.push(node.id.substring(2));
            added = true;
          }
          new_node.label = node.realLabel;
        }
      } else if (options.text === "blank") {
        new_node.label = "";
      } else if (options.text === "custom") {
        new_node.label = options.textValue;
      } else {
        new_node.label = node.realLabel;
      }
    }

    // color
    if (options.nodeColor) {
      new_node.style.fill = options.nodeColor;
    }

    // resize by property
    if (options.nodeSize === "autoResizeByProperty" && !added) {
      nodesMissingProperties.push(node.id.substring(2));
    }

    return new_node;
  }

  getEdgeStyleFromOptions(edge, options, edgesMissingProperties) {
    // line type
    let lineStyle = Defaults.edgeStyles[options.lineType];
    if (!lineStyle) {
      return;
    }
    let new_edge = { type: lineStyle.type, style: { ...lineStyle.style } };

    // text
    if (options.text !== undefined) {
      if (options.text === "label") {
        new_edge.label = edge.label;
      } else if (options.text === "id") {
        new_edge.label = edge.realId;
      } else if (options.text === "property") {
        if (typeof edge.properties === "object" && Object.keys(edge.properties).length > 0) {
          if (options.textValue in edge.properties) {
            new_edge.label = edge.properties[options.textValue];
          } else {
            new_edge.label = "N/A";
          }
        } else {
          new_edge.label = edge.realLabel;
          edgesMissingProperties.push(edge.id.substring(2));
        }
      } else if (options.text === "blank") {
        new_edge.label = "";
      } else if (options.text === "custom") {
        new_edge.label = options.textValue;
      }
    }

    // color
    if (options.lineColor !== undefined) {
      new_edge.style.stroke = options.lineColor;
    }

    // dash
    if (options.lineDash) {
      new_edge.style.lineDash = [5, 10, 5];
    } else {
      new_edge.style.lineDash = false;
    }

    // arrow
    if (options.lineArrow === undefined || options.lineArrow) {
      new_edge.style.endArrow = { fill: options.lineColor, path: Defaults.endArrowPath };
    } else {
      new_edge.style.endArrow = false;
    }

    return new_edge;
  }

  /**
   * 将图绘制在 div 上
   * @param data {{nodes: Array, edges: Array}}
   * @param divId {String}
   */
  drawGraph(graphData) {
    if ("nodes" in graphData && "edges" in graphData) {
      let nodesMissingProperties = [];
      let edgesMissingProperties = [];
      // 根据可视化配置更新默认的样式
      const showNodes = graphData.nodes.map((node) => {
        let new_node = {
          id: "V$" + node.id,
          label: node.label,
          realId: node.id,
          realLabel: node.label,
          properties: node.properties,
        };
        const options = this.getNodeOptions(node);
        if (options !== undefined) {
          const style = this.getNodeStyleFromOptions(new_node, options, nodesMissingProperties);
          Object.assign(new_node, style);
        }
        return new_node;
      });

      const showEdges = graphData.edges.map((edge) => {
        let new_edge = {
          id: "E$" + edge.id,
          label: edge.label,
          realId: edge.id,
          realLabel: edge.label,
          source: "V$" + edge.source,
          target: "V$" + edge.target,
          properties: edge.properties,
        };
        const options = this.getEdgeOptions(edge);
        if (options !== undefined) {
          const style = this.getEdgeStyleFromOptions(new_edge, options, edgesMissingProperties);
          Object.assign(new_edge, style);
        }
        if (edge.source === edge.target) {
          new_edge.type = "loop";
        }
        return new_edge;
      });

      this.graph_.data({ nodes: showNodes, edges: showEdges });
      this.graph_.render();

      if (nodesMissingProperties.length === 0) {
        this.resizeAllNodes();
      }

      if (this.autoShowProperty_) {
        this.getAllProperties(nodesMissingProperties, edgesMissingProperties);
      }
    }
  }

  downloadImage() {
    this.graph_.downloadFullImage("export", "image/png", { backgroundColor: "white" });
  }

  resize() {
    if (this.appRef_.current && this.graph_) {
      if (this.appRef_.current.clientWidth > 0) {
        this.graph_.changeSize(this.appRef_.current.clientWidth, this.props.canvasHeight);
      }
    }
  }

  render() {
    this.resize();
    return <div id="graphVis" ref={this.appRef_} style={this.props.style} />;
  }
}

GraphVis.propTypes = {
  style: PropTypes.object,
  defaultGraphData: PropTypes.object,
  getNodePropertyCallback: PropTypes.func,
  getEdgePropertyCallback: PropTypes.func,
  showPropertyCallback: PropTypes.func,
  getOutEdgesCallback: PropTypes.func,
  graphChangedCallback: PropTypes.func,
  nodeVisOptions: PropTypes.object,
  edgeVisOptions: PropTypes.object,
  canvasHeight: PropTypes.number,
};

export default GraphVis;
