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

/* eslint-disable max-len */
import React from "react";
import {
  Balloon,
  Button,
  Card,
  Dialog,
  Icon,
  Input,
  Message,
  NumberPicker,
  Loading,
  Search,
  Select,
  Tab,
  Table,
  Tree,
} from "@alicloud/console-components";
import intl from "@alicloud/console-components-intl";
import SlidePanel from "@alicloud/console-components-slide-panel";
import GraphVis from "../GraphVis";
import SettingsPanel from "../SettingsPanel";
import QueryInput from "../QueryInput";
import createRequest from "../../utils/Request";
import URLUtils from "../../utils/URLUtils";
import HistoryStorage from "../../utils/HistoryStorage";
import LogView from "../LogView";
import TableView from "../TableView";
import SettingsStorage from "../../utils/SettingsStorage";
import Defaults from "../../utils/Defaults";
import ParameterInput from "../ParameterInput";

import "./index.css";

const request = createRequest();
const settingsStorage = new SettingsStorage();
const urlUtils = new URLUtils();
const historyStorage = new HistoryStorage();

const defaultDSL = "";
const docUrl = "https://help.aliyun.com/knowledge_detail/102863.html";

class GraphZone extends React.Component {
  constructor(props) {
    super(props);
    this.graphlastFounds_ = [];
    this.graphLastFoundsIndex_ = 0;
    const connInfo = historyStorage.loadHistory();
    this.state = {
      windowHeight: window.innerHeight,
      loadingVisible: false,
      errorResult: "",
      selectedId: null,
      selectedLabel: null,
      selectedType: null,
      propertyEditDialogVisible: false,
      nodePickDialogVisible: false,
      propertys: [],
      labels: [
        { key: "nodes", label: "点 Label", children: [] },
        { key: "edges", label: "边 Label", children: [] },
      ],
      expandedKeys: ["nodes", "edges"],
      checkedKeys: [],
      searchIndex: [],
      editPropertyData: [],
      propertyInputDialogVisible: false,
      propertyInputIsModify: true,
      propertyInputOldRowId: null,
      propertyInputKey: "",
      propertyInputValueType: "string",
      propertyInputValue: "",

      connected: false,
      connectDialogVisible: false,
      connectHost: connInfo.host,
      connectPortStr: typeof connInfo.port != "number" ? "" : connInfo.port + "",
      connectPort: connInfo.port,
      connectUser: connInfo.username,
      connectPassword: "",
      mode: "cypher",

      viewType: "graph",

      // for settings
      settingsDialogVisible: false,
      settingsDialogIsNode: true,
      settingsDialogLabel: undefined,
      settingsDialogData: {},

      checkboxVisible: "hidden",

      queryTimeCost: 0,

      rows: [],
      logRecords: [],

      selectedAlgo: null,
      isAp: false,
    };

    this.layout = Defaults.layout;
    this.settings = settingsStorage.load();

    window.onresize = () => {
      this.setState({
        windowHeight: window.innerHeight,
      });
    };

    this.labelCount = { nodes: {}, edges: {} };

    this.algorithmTemplate = {
      "0-1": {
        category: "pick",
        title: "随机选点",
        parameters: {
          label: { name: "点标签", optional: true },
          k: { name: "数量" },
        },
        template: "`g.V()" + "${p.label === undefined ? '' : '.hasLabel(\"' + p.label + '\")'}" + ".sample(${p.k})`",
        preferredLayout: "random",
      },
      "0-2": {
        category: "pick",
        title: "随机选边",
        parameters: {
          label: { name: "边标签", optional: true },
          k: { name: "数量" },
        },
        template: "`g.E()" + "${p.label === undefined ? '' : '.hasLabel(\"' + p.label + '\")'}" + ".sample(${p.k})`",
      },
      "1-1": {
        category: "path",
        title: "K阶邻居",
        parameters: {
          id: { name: "点ID" },
          label: { name: "边标签", optional: true },
          direction: { name: "方向", candidates: ["both", "in", "out"] },
          k: { name: "K" },
          limit: { name: "LIMIT", optional: true },
        },
        template:
          "`g.V('${p.id}')" +
          ".repeat(${p.direction}E(${p.label === undefined ? '' : \"'\" + p.label + \"'\"}).otherV().simplePath())" +
          ".times(${p.k}).path()" +
          "${p.limit === undefined ? '' : '.limit(' + p.limit + ')'}`",
      },
      "1-2": {
        category: "path",
        title: "两点之间K阶内路径",
        parameters: {
          id1: { name: "点ID 1" },
          id2: { name: "点ID 2" },
          label: { name: "边标签", optional: true },
          direction: { name: "方向", candidates: ["both", "in", "out"] },
          k: { name: "K" },
          limit: { name: "LIMIT", optional: true },
        },
        template:
          "`g.V('${p.id1}')" +
          ".repeat(${p.direction}E(${p.label === undefined ? '' : \"'\" + p.label + \"'\"}).otherV().simplePath())" +
          ".until(__.hasId('${p.id2}').or().loops().is(P.gte(${p.k}))).hasId('${p.id2}').path()" +
          "${p.limit === undefined ? '' : '.limit(' + p.limit + ')'}`",
        preferredLayout: "dagreLR",
      },
      "1-3": {
        category: "path",
        title: "两点之间最短路径",
        parameters: {
          id1: { name: "点ID 1" },
          id2: { name: "点ID 2" },
          label: { name: "边标签", optional: true },
          direction: { name: "方向", candidates: ["both", "in", "out"] },
          k: { name: "最大跳数" },
        },
        template:
          "`g.V('${p.id1}')" +
          ".repeat(${p.direction}E(${p.label === undefined ? '' : \"'\" + p.label + \"'\"}).otherV().simplePath())" +
          ".until(__.hasId('${p.id2}').or().loops().is(P.gte(${p.k}))).hasId('${p.id2}').path()" +
          ".limit(1)`",
        preferredLayout: "dagreLR",
      },
      "1-4": {
        category: "path",
        title: "共同邻居",
        parameters: {
          id1: { name: "点ID 1" },
          id2: { name: "点ID 2" },
          label: { name: "边标签", optional: true },
          // direction: { name: "方向", candidates: ["both", "in", "out"] },
          limit: { name: "LIMIT", optional: true },
        },
        template:
          "`g.V('${p.id1}')" +
          ".repeat(bothE().otherV().simplePath())" +
          ".times(2).hasId('${p.id2}').path()" +
          "${p.limit === undefined ? '' : '.limit(' + p.limit + ')'}`",
        preferredLayout: "dagreLR",
      },
      "1-5": {
        category: "path",
        title: "环检测",
        parameters: {
          id: { name: "点ID" },
          label: { name: "边标签", optional: true },
          direction: { name: "方向", candidates: ["both", "in", "out"] },
          k: { name: "最大跳数" },
          limit: { name: "LIMIT", optional: true },
        },
        template:
          "`g.V('${p.id}')" +
          ".repeat(${p.direction}E(${p.label === undefined ? '' : \"'\" + p.label + \"'\"}).otherV())" +
          ".until(or(cyclicPath(), loops().is(gte(${p.k})))).cyclicPath().path()" +
          "${p.limit === undefined ? '' : '.limit(' + p.limit + ')'}`",
      },
    };

    this.algorithmTree = [
      {
        label: "选择",
        key: "cat-pick",
        children: [
          { label: "随机选点", key: "0-1" },
          { label: "随机选边", key: "0-2" },
        ],
      },
      {
        label: "路径",
        key: "cat-path",
        children: [
          {
            label: "K阶邻居",
            key: "1-1",
          },
          {
            label: "两点之间K阶内路径",
            key: "1-2",
          },
          {
            label: "两点之间最短路径",
            key: "1-3",
          },
          {
            label: "共同邻居",
            key: "1-4",
          },
          {
            label: "环检测",
            key: "1-5",
          },
        ],
      },
    ];

    this.buildingSchema = false;
    this.schema = null;

    Date.prototype.format = function (fmt) {
      var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        S: this.getMilliseconds().toString().padEnd(3, "0"), //毫秒
      };
      if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
      }
      for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
          fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        }
      }
      return fmt;
    };
  }

  componentDidMount() {
    const dsl = urlUtils.getQueryString("dsl");
    if (dsl) {
      this.gremlinInput_.setValue(dsl);
      // if (this.state.connected) {
      this.handleSubmitDSL(dsl);
      // }
    } else {
      // check connection
      this.checkConnection();
    }
  }

  appendLog(type, content, extra) {
    const dt = new Date();
    const logRecords = this.state.logRecords;
    logRecords.push({
      // eventTime: dt.toISOString(),
      eventTime: dt.format("yyyy-MM-dd hh:mm:ss.S"),
      eventType: type,
      content: content,
      extra: extra,
    });
    this.setState({ logRecords: logRecords });
  }

  clearLogs() {
    this.setState({ logRecords: [] });
  }

  getNodeProperty(selectId, callback) {
    request.submitDSL(
      `g.V("${selectId}").valueMap()`,
      (msg) => {
        let property = msg.rows[0];
        property["~id"] = selectId;
        if (callback) {
          callback(property);
        }
      },
      (_) => {}
    );
  }

  getNodePropertiesBatch(ids, callback) {
    request.submitDSL(
      `g.V('${ids.join("','")}').local(properties().fold())`,
      (msg) => {
        let properties = msg.rows;
        if (callback) {
          callback(ids, properties);
        }
      },
      (_) => {}
    );
  }

  getEdgeProperty(selectId, callback) {
    request.submitDSL(
      `g.E("${selectId}").local(properties().fold())`,
      (msg) => {
        let properties = msg.rows;
        if (callback) {
          callback(properties);
        }
      },
      (_) => {}
    );
  }

  getEdgePropertiesBatch(ids, callback) {
    request.submitDSL(
      `g.E('${ids.join("','")}').valueMap()`,
      (msg) => {
        let properties = msg.rows;
        if (callback) {
          callback(ids, properties);
        }
      },
      (_) => {}
    );
  }

  getOutEdges(selectId, isOut, callback) {
    const dsl = `g.V("${selectId}").` + (isOut ? "outE()" : "inE()");
    this.appendLog("req", dsl);
    request.submitDSL(
      dsl,
      (msg) => {
        // 如果没有可视化设置，则为顶点非配随机颜色
        this.initStyles(msg.graph);
        if (callback) {
          const result = callback(msg.graph);
          this.appendLog(
            "rsp",
            `获取到[${msg.rows.length}]行数据，新增[${result.nodes.length}]个点, [${result.edges.length}]条边`,
            JSON.stringify(msg)
          );
          Message.success({
            title: "执行成功",
            content: `新增点数量[${result.nodes.length}], 边数量[${result.edges.length}]`,
            closeable: true,
            duration: 2000,
          });
        }
      },
      (_) => {
        Message.error({ title: "执行出错", content: "查询一度节点出错", hasMask: true, duration: 1000 });
      }
    );
  }

  setNodesHidden(label, hidden) {
    if (this.graphVis_) {
      this.graphVis_.setNodesHidden(label, hidden);
    }
  }

  setEdgesHidden(label, hidden) {
    if (this.graphVis_) {
      this.graphVis_.setEdgesHidden(label, hidden);
    }
  }

  setAllNodesHidden(hidden) {
    if (this.graphVis_) {
      this.graphVis_.setAllNodesHidden(hidden);
    }
  }

  setAllEdgesHidden(hidden) {
    if (this.graphVis_) {
      this.graphVis_.setAllEdgesHidden(hidden);
    }
  }

  searchNodeAndEdge(keyword) {
    if (this.graphVis_) {
      return this.graphVis_.searchNodeAndEdge(keyword);
    }
  }

  focusNodeOrEdge(id) {
    if (this.graphVis_) {
      this.graphVis_.focusNodeOrEdge(id);
    }
  }

  clearFocused() {
    if (this.graphVis_) {
      this.graphVis_.clearFocused();
    }
  }

  reLayout() {
    if (this.graphVis_) {
      this.graphVis_.layout();
    }
  }

  zoomExtends() {
    if (this.graphVis_) {
      this.graphVis_.zoomExtends();
    }
  }

  fitCenter() {
    if (this.graphVis_) {
      this.graphVis_.fitCenter();
    }
  }

  searchOnGraph(Keyword) {
    if (Keyword.length > 0) {
      const founds = this.searchNodeAndEdge(Keyword);
      if (founds.nodes.length > 0) {
        this.graphlastFounds_ = founds.nodes;
      } else if (founds.edges.length > 0) {
        this.graphlastFounds_ = founds.edges;
      } else {
        this.graphlastFounds_ = [];
        Message.notice({ title: "没有结果", content: "当前可视化区域没有搜索到任何结果", duration: 1500 });
      }
      this.graphLastFoundsIndex_ = 0;
      if (this.graphlastFounds_.length > 0) {
        this.focusNodeOrEdge(this.graphlastFounds_[this.graphLastFoundsIndex_]);
      }
    }
  }

  searchResultShowNext() {
    if (this.graphlastFounds_.length > 0) {
      this.graphLastFoundsIndex_ = (this.graphLastFoundsIndex_ + 1) % this.graphlastFounds_.length;
      this.focusNodeOrEdge(this.graphlastFounds_[this.graphLastFoundsIndex_]);
    }
  }

  searchResultShowPrev() {
    if (this.graphlastFounds_.length > 0) {
      this.graphLastFoundsIndex_ -= 1;
      if (this.graphLastFoundsIndex_ === -1) {
        this.graphLastFoundsIndex_ += this.graphlastFounds_.length;
      }
      this.focusNodeOrEdge(this.graphlastFounds_[this.graphLastFoundsIndex_]);
    }
  }

  searchResultClear() {
    this.graphlastFounds_ = [];
    this.graphLastFoundsIndex_ = 0;
    // this.zoomExtends();
    this.clearFocused();
  }

  createLabelCount(graphData) {
    const nodeLabelCount = {};
    for (const node of graphData.nodes) {
      const label = node.label;
      nodeLabelCount[label] = label in nodeLabelCount ? nodeLabelCount[label] + 1 : 1;
    }

    const edgeLabelCount = {};
    for (const edge of graphData.edges) {
      const label = edge.label;
      edgeLabelCount[label] = label in edgeLabelCount ? edgeLabelCount[label] + 1 : 1;
    }

    return { nodes: nodeLabelCount, edges: edgeLabelCount };
  }

  createLabelsIndex(graphData) {
    const nodeLabelChildren = [];
    const edgeLabelChildren = [];
    const newCheckedKeys = [];
    const nodeLabelSet = new Set();
    for (const node of graphData.nodes) {
      nodeLabelSet.add(node.label);
    }
    for (const nodeLabel of nodeLabelSet) {
      const treeKey = `node-${nodeLabel}`;
      nodeLabelChildren.push({ key: treeKey, label: nodeLabel });
      newCheckedKeys.push(treeKey);
    }
    const edgeLabelSet = new Set();
    for (const edge of graphData.edges) {
      edgeLabelSet.add(edge.label);
    }
    for (const edgeLabel of edgeLabelSet) {
      const treeKey = `edge-${edgeLabel}`;
      edgeLabelChildren.push({ key: treeKey, label: edgeLabel });
      newCheckedKeys.push(treeKey);
    }

    const newLabels = [];
    if (nodeLabelChildren.length > 0) {
      newLabels.push({ key: "nodes", label: "点 Label", children: nodeLabelChildren });
    }
    if (edgeLabelChildren.length > 0) {
      newLabels.push({ key: "edges", label: "边 Label", children: edgeLabelChildren });
    }
    return { newLabels, newCheckedKeys };
  }

  createSearchIndex(graphData) {
    const nodeLabels = new Set();
    const nodePropertyKey = new Set();
    const nodePropertyValue = new Set();
    const edgeLabels = new Set();
    const edgePropertyKey = new Set();
    const edgePropertyValue = new Set();

    graphData.nodes.forEach((node) => {
      if ("label" in node) {
        nodeLabels.add(node.label);
      }
      if (node["properties"] !== undefined) {
        for (const key in node.properties) {
          if (key.constructor === String && key.length > 0) {
            nodePropertyKey.add(key);
            const value = node.properties[key];
            if (value.constructor === String && value.length > 0) {
              nodePropertyValue.add(value);
            }
          }
        }
      }
    });
    graphData.edges.forEach((edge) => {
      if ("label" in edge) {
        edgeLabels.add(edge.label);
      }
      if (edge["properties"] !== undefined) {
        for (const key in edge.properties) {
          if (key.constructor === String && key.length > 0) {
            edgePropertyKey.add(key);
            const value = edge.properties[key];
            if (value.constructor === String && value.length > 0) {
              edgePropertyValue.add(value);
            }
          }
        }
      }
    });
    const newSearchIndex = [
      { label: "点标签", children: [] },
      { label: "点属性名", children: [] },
      { label: "点属性值", children: [] },
      { label: "边标签", children: [] },
      { label: "边属性名", children: [] },
      { label: "边属性值", children: [] },
    ];
    for (const label of nodeLabels) {
      newSearchIndex[0].children.push({ label, value: label });
    }
    for (const key of nodePropertyKey) {
      newSearchIndex[1].children.push({ label: key, value: key });
    }
    for (const value of nodePropertyValue) {
      newSearchIndex[2].children.push({ label: value, value });
    }
    for (const label of edgeLabels) {
      newSearchIndex[3].children.push({ label, value: label });
    }
    for (const key of edgePropertyKey) {
      newSearchIndex[4].children.push({ label: key, value: key });
    }
    for (const value of edgePropertyValue) {
      newSearchIndex[5].children.push({ label: value, value });
    }

    return newSearchIndex;
  }

  drawGraph(graphData) {
    if (this.graphVis_) {
      this.graphVis_.drawGraph(graphData);
    }
  }

  updateGraphData(graphData) {
    if (graphData && "nodes" in graphData && "edges" in graphData) {
      this.setAllNodesHidden(false);
      this.setAllEdgesHidden(false);
      const { newLabels, newCheckedKeys } = this.createLabelsIndex(graphData);
      const newSearchIndex = this.createSearchIndex(graphData);
      this.setState({
        labels: newLabels,
        checkedKeys: newCheckedKeys,
        searchIndex: newSearchIndex,
      });
    }
  }

  initStyles(graph) {
    let changed = false;
    for (const node of graph.nodes) {
      if (!(node.label in this.settings.node)) {
        this.settings.node[node.label] = Defaults.defaultNodeCfg();
        changed = true;
      }
    }

    for (const edge of graph.edges) {
      if (!(edge.label in this.settings.edge)) {
        this.settings.edge[edge.label] = Defaults.defaultEdgeCfg();
        changed = true;
      }
    }

    if (changed) {
      settingsStorage.save(this.settings);
    }
  }

  handleSubmitDSL(inputDSL) {
    if (inputDSL.length === 0) {
      Message.error({
        title: "DSL 语句为空",
        content: "请输入要执行的 DSL 语句",
        duration: 1500,
      });
      return;
    }
    this.appendLog("req", inputDSL);
    // eslint-disable-next-line no-restricted-globals
    history.pushState({}, "", urlUtils.changeURLArg(window.location.href, "dsl", inputDSL));
    this.showLoading();
    request.submitDSL(
      inputDSL,
      (msg) => {
        this.appendLog(
          "rsp",
          `获取到[${msg.rows.length}]行数据，解析出[${msg.graph.nodes.length}]个点, [${msg.graph.edges.length}]条边`,
          JSON.stringify(msg)
        );
        this.hideLoading();
        var isAp = false;
        if (inputDSL.startsWith("graph.compute")) {
          isAp = true;
        }
        this.setState({ isAp: isAp });
        this.setState({ connected: true });
        this.setState({ rows: msg.rows });
        if (msg.graph.nodes.length > 0) {
          const graphData = msg.graph;
          // 如果没有可视化设置，则为顶点非配随机颜色
          this.initStyles(graphData);
          this.drawGraph(graphData);
          this.labelCount = this.createLabelCount(graphData);
          this.updateGraphData(graphData);
          Message.success({
            title: "执行成功",
            content: `获取到[${msg.rows.length}]行数据，解析出[${graphData.nodes.length}]个点, [${graphData.edges.length}]条边`,
            closeable: true,
            duration: 2000,
          });
          this.onViewChange("graph");
        } else {
          this.onViewChange("table");
        }
      },
      (error) => {
        this.hideLoading();
        if (error.status === 401) {
          this.appendLog("err", "会话过期，请重新连接实例");
          Message.error("会话过期，请重新连接实例");
          this.setState({ connected: false });
          this.showConnectDialog();
          return;
        }
        if (error.status === 500) {
          this.appendLog("err", "查询失败，请检查DSL", error.data.msg);
          Message.error("查询失败，请检查DSL");
          this.setState({ connected: true });
          this.onViewChange("log");
          return;
        }
        if (error.msg === undefined) {
          this.appendLog("err", "查询失败，请检查服务状态");
          Message.error("查询失败，请检查服务状态");
        } else {
          this.appendLog("err", "查询失败", error.msg);
          this.onViewChange("log");
        }
      }
    );
  }

  updatePropertysState(type, id, label, data) {
    const newPropertys = [];
    for (const name in data) {
      if (name.constructor === String) {
        newPropertys.push({
          key: name,
          value: data[name],
        });
      }
    }
    this.setState({
      selectedId: id,
      selectedLabel: label,
      selectedType: type,
      propertys: newPropertys,
    });
  }

  showLoading() {
    this.setState({
      loadingVisible: true,
    });
  }

  hideLoading() {
    this.setState({
      loadingVisible: false,
    });
  }

  changeLayout(layout) {
    this.layout = layout;
    if (this.graphVis_) {
      this.graphVis_.changeLayout(layout);
    }
  }

  changeNodeSettings(label, settings) {
    this.settings.node[label] = settings;
    this.graphVis_.applyNodeSettings(label, settings);
  }

  changeEdgeSettings(label, settings) {
    this.settings.edge[label] = settings;
    this.graphVis_.applyEdgeSettings(label, settings);
  }

  showPropertyEditDialog() {
    var editPropertyData = [];
    this.state.propertys.forEach((p) => {
      if (p.key !== "~id") {
        editPropertyData.push({ id: p.key + "#" + typeof p.value + "#" + p.value, key: p.key, value: p.value });
      }
    });
    this.setState({
      editPropertyData: editPropertyData,
      propertyEditDialogVisible: true,
    });
  }

  hidePropertyEditDialog() {
    this.setState({
      propertyEditDialogVisible: false,
    });
  }

  showNodePickDialog() {
    this.setState({ nodePickDialogVisible: true });
  }

  hideNodePickDialog() {
    this.setState({ nodePickDialogVisible: false });
  }

  compareRow(a, b) {
    if (a.id > b.id) {
      return 1;
    } else {
      return -1;
    }
  }

  showPropertyInputDialog(record) {
    var isModify = record != null;
    if (isModify) {
      this.setState({
        propertyInputOldRowId: record.id,
        propertyInputKey: record.key,
        propertyInputValue: record.value,
        propertyInputValueType: typeof record.value,
      });
    } else {
      // clear inputs
      this.setState({
        propertyInputKey: "",
        propertyInputValueType: "string",
        propertyInputValue: "",
      });
    }
    this.setState({ propertyInputDialogVisible: true, propertyInputIsModify: isModify });
  }

  constructRecordDataFromInput() {
    var value = this.state.propertyInputValue;
    if (this.state.propertyInputValueType === "number") {
      value = Number(value);
      if (isNaN(value)) {
        // illegal input
        return null;
      }
    } else if (this.state.propertyInputValueType === "boolean") {
      value = Boolean(value);
    }
    var rowKey =
      this.state.propertyInputKey + "#" + this.state.propertyInputValueType + "#" + this.state.propertyInputValue;
    return { id: rowKey, key: this.state.propertyInputKey, value: value };
  }

  handleAddPropety() {
    var record = this.constructRecordDataFromInput();
    if (record === null) {
      Message.warning("属性value无效");
      return;
    }
    var duplicate = false;
    this.state.editPropertyData.some((r) => {
      if (r.id === record.id) {
        duplicate = true;
      } else if (this.state.selectedType === "edge" && r.key === record.key) {
        duplicate = true;
      }
      return duplicate;
    });
    if (duplicate) {
      Message.warning("属性已存在");
      return;
    }
    record.new = true;
    var editPropertyData = this.state.editPropertyData;
    editPropertyData.push(record);
    this.setState({ editPropertyData: editPropertyData.sort(this.compareRow) });
  }

  handleModifyProperty() {
    var record = this.constructRecordDataFromInput();
    if (record === null) {
      Message.warning("属性value无效");
      return;
    }
    var oldRowKey = this.state.propertyInputOldRowId;
    if (oldRowKey === record.id) {
      // nothing changed
      return;
    }
    this.state.editPropertyData.some((r) => {
      if (r.id === oldRowKey) {
        record.oldData = r;
        return true;
      }
      return false;
    });
    if (record.oldData.new) {
      record.new = true;
    }
    var editPropertyData = this.state.editPropertyData.filter((r) => r.id !== oldRowKey);
    editPropertyData.push(record);
    this.setState({ editPropertyData: editPropertyData.sort(this.compareRow) });
  }

  handleDeleteProperty(record) {
    var editPropertyData = this.state.editPropertyData.filter((r) => r.id !== record.id);
    if (!record.new) {
      record.deleted = true;
      editPropertyData.push(record);
      editPropertyData.sort(this.compareRow);
    }
    this.setState({ editPropertyData: editPropertyData });
  }

  handleRestoreProperty(record) {
    var rowKey = record.id;
    if (record.deleted) {
      delete record.deleted;
    } else if (record.oldData != null) {
      record = record.oldData;
    } else {
      return;
    }
    var editPropertyData = this.state.editPropertyData.filter((r) => r.id !== rowKey);
    editPropertyData.push(record);
    this.setState({ editPropertyData: editPropertyData.sort(this.compareRow) });
  }

  hidePropertyInputDialog(ok) {
    if (ok) {
      if (this.state.propertyInputIsModify) {
        this.handleModifyProperty();
      } else {
        this.handleAddPropety();
      }
    }
    this.setState({ propertyInputDialogVisible: false });
  }

  showConnectDialog() {
    this.setState({ connectDialogVisible: true });
  }

  hideConnectDialog() {
    this.setState({ connectDialogVisible: false });
  }

  propertyInputChangeValueType(type) {
    var value = "";
    if (type === "number") {
      value = 0;
    } else if (type === "boolean") {
      value = true;
    }
    this.setState({ propertyInputValueType: type, propertyInputValue: value });
  }

  constructValue(v) {
    if (typeof v === "string") {
      v = v.replaceAll('"', '\\"');
      return `"${v}"`;
    } else {
      return `${v}`;
    }
  }

  // TODO: support set property
  buildUpdateVertexDsl(deleted, modified, added) {
    var dsl = `g.V("${this.state.selectedId}").as('x')`;
    deleted.forEach((r) => {
      dsl += `.sideEffect(properties("${r.key}").where(value().is(${this.constructValue(r.value)})).drop())`;
    });
    modified.forEach((r) => {
      var oldData = r.oldData;
      var oldValue = null;
      while (oldData != null) {
        oldValue = oldData.value;
        oldData = oldData.oldData;
      }
      // 只有key和value都相等的时候才修改
      dsl += `.sideEffect(properties("${r.key}").where(value().is(${this.constructValue(
        oldValue
      )})).coalesce(drop(), select('x').property("${r.key}", ${this.constructValue(r.value)})))`;
    });
    added.forEach((r) => {
      dsl += `.property("${r.key}", ${this.constructValue(r.value)})`;
    });
    dsl += ".valueMap()";
    return dsl;
  }

  buildUpdateEdgeDsl(deleted, modified, added) {
    var dsl = `g.E("${this.state.selectedId}").as('x')`;
    deleted.forEach((r) => {
      dsl += `.sideEffect(properties("${r.key}").where(value().is(${this.constructValue(r.value)})).drop())`;
    });
    modified.forEach((r) => {
      var oldData = r.oldData;
      var oldValue = null;
      while (oldData != null) {
        oldValue = oldData.value;
        oldData = oldData.oldData;
      }
      // 只有key和value都相等的时候才修改
      dsl += `.sideEffect(properties("${r.key}").where(value().is(${this.constructValue(
        oldValue
      )})).coalesce(drop(), select('x').property("${r.key}", ${this.constructValue(r.value)})))`;
    });
    added.forEach((r) => {
      dsl += `.property("${r.key}", ${this.constructValue(r.value)})`;
    });
    dsl += ".valueMap()";
    return dsl;
  }

  handleSubmitPropertyUpdates() {
    var deleted = [];
    var modified = [];
    var added = [];

    var newProperties = [];
    this.state.editPropertyData.forEach((r) => {
      if (r.new) {
        added.push(r);
      } else if (r.deleted) {
        deleted.push(r);
      } else if (r.oldData) {
        modified.push(r);
      }
      if (!r.deleted) {
        newProperties.push({ key: r.key, value: r.value });
      }
    });
    if (added.length === 0 && deleted.length === 0 && modified.length === 0) {
      // nothing changed
      this.hidePropertyEditDialog();
      return;
    }

    console.debug("added:", added, "modified:", modified, "deleted:", deleted);

    var isVertex = this.state.selectedType === "vertex";
    var dsl = "";
    if (isVertex) {
      dsl = this.buildUpdateVertexDsl(deleted, modified, added);
    } else {
      dsl = this.buildUpdateEdgeDsl(deleted, modified, added);
    }

    // TODO: 这里有个问题，修改属性之后，这里会用新属性更新面板，但是GraphVis里的数据没有更新，
    // 下次再选中点、边的时候，还是显示旧的属性
    this.showLoading();
    request.submitDSL(
      dsl,
      (msg) => {
        this.hideLoading();
        // var property = isVertex ? dataParser.parseNodeProperty(msg) :
        //   dataParser.parseEdgeProperty(msg.result);
        let property = msg.rows[0];
        property["~id"] = this.state.selectedId;
        Message.success({
          title: "修改成功",
          closeable: true,
          duration: 1000,
        });
        // newProperties.push({ key: '~id', value: this.state.selectedId });
        // this.setState({ propertys: newProperties });
        this.hidePropertyEditDialog();
        this.updatePropertysState(this.state.selectedType, property);
      },
      (error) => {
        this.hideLoading();
        let errMsg = "执行失败，请检查实例状态";
        if (error.status === 401) {
          errMsg = "会话过期，请重新连接实例";
        } else if (error.msg !== undefined) {
          errMsg = error.msg;
        }
        Message.error({
          title: "执行出错",
          content: errMsg,
          closeable: true,
          hasMask: true,
          duration: 5000,
        });
      }
    );
  }

  handleTreeCheck(keys, info) {
    const { checked, eventKey } = info.node.props;
    if (eventKey === "nodes") {
      this.setAllNodesHidden(checked);
    } else if (eventKey === "edges") {
      this.setAllEdgesHidden(checked);
    } else if (eventKey.substr(0, 5) === "node-") {
      this.setNodesHidden(eventKey.substr(5), checked);
    } else if (eventKey.substr(0, 5) === "edge-") {
      this.setEdgesHidden(eventKey.substr(5), checked);
    }
    this.setState({
      checkedKeys: keys,
    });
  }

  handleConnect() {
    if (
      this.state.connectHost.length === 0 ||
      this.state.connectUser.length === 0 ||
      this.state.connectPassword === 0 ||
      typeof this.state.connectPort != "number"
    ) {
      Message.error("请检查输入");
      return;
    }
    this.showLoading();
    // FIXME: password should be encrypted when sending through http
    const connInfo = {
      host: this.state.connectHost,
      port: this.state.connectPort,
      username: this.state.connectUser,
      password: this.state.connectPassword,
    };

    request.connect(
      connInfo,
      () => {
        this.appendLog("rsp", `连接实例[${connInfo.username}@${connInfo.host}:${connInfo.port}]成功`);
        this.hideLoading();
        Message.success("连接成功");
        this.setState({ connected: true });
        this.hideConnectDialog();
        historyStorage.saveHistory({
          host: this.state.connectHost,
          port: this.state.connectPort,
          username: this.state.connectUser,
        });
      },
      (result) => {
        this.hideLoading();
        this.setState({ connected: false });
        if (result.status === 401) {
          // 账号密码错误
          this.appendLog("err", `连接实例[${connInfo.username}@${connInfo.host}:${connInfo.port}]失败: 账号密码错误`);
          Message.error("账号密码错误");
        } else {
          this.appendLog(
            "err",
            `连接实例[${connInfo.username}@${connInfo.host}:${connInfo.port}]失败: 请检查地址、端口和实例状态`
          );
          Message.error("连接实例失败，请检查地址、端口和实例状态");
        }
      }
    );
  }

  checkConnection() {
    request.submitDSL(
      "g.V().count()",
      (_) => {
        this.setState({ connected: true });
      },
      (_) => {
        this.setState({ connected: false });
      }
    );
  }

  checkPort(val) {
    const regexp = /^[0-9]+$/;
    return regexp.test(val);
  }

  onViewChange(v) {
    this.setState({ viewType: v });
  }

  isGraphView() {
    return this.state.viewType === "graph";
  }

  isTableView() {
    return this.state.viewType === "table";
  }

  isLogView() {
    return this.state.viewType === "log";
  }

  showSettingsDialog(isNode, label) {
    let data;
    if (isNode) {
      if (label in this.settings.node) {
        data = this.settings.node[label];
      } else {
        data = Defaults.nodeSettings;
      }
    } else {
      if (label in this.settings.edge) {
        data = this.settings.edge[label];
      } else {
        data = Defaults.edgeSettings;
      }
    }

    this.setState({
      settingsDialogVisible: true,
      settingsDialogIsNode: isNode,
      settingsDialogLabel: label,
      settingsDialogData: data,
    });
  }

  hideSettingsDialog() {
    this.setState({ settingsDialogVisible: false });
  }

  downloadImage() {
    this.graphVis_.downloadImage();
  }

  async buildGraphSchema() {
    // count nodes & edges by label
    let schema = {
      nodes: [],
      edges: [],
    };
    let labelCount = null;
    this.showLoading();
    try {
      const groupCount = await request.submit(
        "g.inject(1).project('nodes', 'edges').by(g.V().groupCount().by(label)).by(g.E().groupCount().by(label))"
      );
      labelCount = groupCount.rows[0];
      // sample nodes of each label
      let edges = {};
      for (const label of Object.keys(labelCount.nodes)) {
        let node = { id: label, label: label, properties: {}, settings: { text: "label" } };
        const samples = await request.submit(
          `g.V().hasLabel("${label}").sample(10).fold().project('keys', 'outE', 'inE')
            .by(unfold().valueMap().select(keys).unfold().dedup().fold())
            .by(unfold().outE().sample(10).project('targetLabel', 'edgeLabel').by(inV().label()).by(label).dedup().fold())
            .by(unfold().inE().sample(10).project('sourceLabel', 'edgeLabel').by(outV().label()).by(label).dedup().fold())`
        );
        const row = samples.rows[0];
        for (const e of row.outE) {
          const id = `${label}-${e.edgeLabel}-${e.targetLabel}`;
          edges[id] = { id: id, label: e.edgeLabel, source: label, target: e.targetLabel, settings: { text: "label" } };
        }
        for (const e of row.inE) {
          const id = `${e.sourceLabel}-${e.edgeLabel}-${label}`;
          edges[id] = { id: id, label: e.edgeLabel, source: e.sourceLabel, target: label, settings: { text: "label" } };
        }
        for (let i = 0; i < row.keys.length; ++i) {
          node.properties[`${i}`] = row.keys[i];
        }
        schema.nodes.push(node);
      }
      // sample edges of each label
      let edgeProps = {};
      for (const label of Object.keys(labelCount.edges)) {
        const samples = await request.submit(
          `g.E().hasLabel("${label}").sample(10).valueMap().select(keys).unfold().dedup()`
        );
        let properties = {};
        for (let i = 0; i < samples.rows.length; ++i) {
          properties[`${i}`] = samples.rows[i];
        }
        edgeProps[label] = properties;
      }
      for (const edge of Object.values(edges)) {
        schema.edges.push({ ...edge, properties: edgeProps[edge.label] });
      }
    } catch (error) {
      console.log("error: ", error);
    }
    this.hideLoading();
    this.schema = schema;
    this.buildingSchema = false;
    this.initStyles(schema);
    this.drawGraph(schema);
    this.labelCount = labelCount;
    this.updateGraphData(schema);
  }

  render() {
    const mainViewHeight = this.state.windowHeight - 100;
    const graphVisHeight = mainViewHeight - 20;
    const sideViewHeight = this.state.windowHeight - 228;
    const tableHeightPx = `${(sideViewHeight - 45).toString()}px`;

    const connectDialog = (
      <Dialog
        title={"连接实例"}
        visible={this.state.connectDialogVisible}
        footer={
          <div>
            <Button
              type="primary"
              onClick={() => {
                this.handleConnect();
              }}
            >
              连接
            </Button>
            <Button
              onClick={() => {
                this.hideConnectDialog();
              }}
            >
              取消
            </Button>
          </div>
        }
        onClose={() => this.hideConnectDialog()}
      >
        <div>
          <p>
            <Input
              style={{ width: 400 }}
              label={<span> 地址 </span>}
              value={this.state.connectHost}
              onChange={(value, _) => {
                this.setState({ connectHost: value });
              }}
            />{" "}
            <br />
          </p>
          <p>
            <Input
              style={{ width: 400 }}
              label={<span> 端口 </span>}
              value={this.state.connectPortStr}
              state={this.state.connectPort !== null ? "success" : "error"}
              onChange={(value, _) => {
                var state = { connectPortStr: value, connectPort: null };
                if (this.checkPort(value)) {
                  const port = parseInt(value);
                  if (port > 0 && port < 65535) {
                    state.connectPort = port;
                  }
                }
                this.setState(state);
              }}
            />{" "}
            <br />
          </p>
          <p>
            <Input
              style={{ width: 400 }}
              label={<span> 用户 </span>}
              value={this.state.connectUser}
              onChange={(value, _) => {
                this.setState({ connectUser: value });
              }}
            />{" "}
            <br />
          </p>
          <p>
            <Input
              style={{ width: 400 }}
              label={<span> 密码 </span>}
              value={this.state.connectPassword}
              htmlType="password"
              onChange={(value, _) => {
                this.setState({ connectPassword: value });
              }}
            />
          </p>
        </div>
      </Dialog>
    );

    const nodePickDialog = (
      <Dialog
        visible={this.state.nodePickDialogVisible}
        title="选取顶点"
        onCancel={() => this.hideNodePickDialog()}
        onClose={() => this.hideNodePickDialog()}
      >
        <Tab>
          <Tab.Item title="随机">
            <p>数量</p>
            <NumberPicker type="inline" defaultValue={10} />
            <p>标签</p>
            <Input />
          </Tab.Item>
          <Tab.Item title="按ID">
            <p>Starred projects...</p>
          </Tab.Item>
          <Tab.Item disabled title="按属性">
            <p>Explore projects...</p>
          </Tab.Item>
        </Tab>
      </Dialog>
    );

    const getNodeColor = (label) => {
      let cfg = this.settings.node[label];
      if (cfg === undefined) {
        cfg = Defaults.nodeSettings;
      }
      return cfg.nodeColor;
    };

    const getEdgeColor = (label) => {
      let cfg = this.settings.edge[label];
      if (cfg === undefined) {
        cfg = Defaults.edgeSettings;
      }
      return cfg.lineColor;
    };

    const getNodeShape = (label) => {
      let cfg = this.settings.node[label];
      if (cfg === undefined) {
        cfg = Defaults.nodeSettings;
      }
      return cfg.nodeShape;
    };

    const getLegendDiv = (label) => {
      const shape = getNodeShape(label);
      if (shape === "circle") {
        return <div className="legend-circle" style={{ background: getNodeColor(label) }} />;
      } else if (shape === "box") {
        return <div className="legend-box" style={{ background: getNodeColor(label) }} />;
      } else if (shape === "diamond") {
        return (
          <div className="legend-diamond" style={{ borderBottomColor: getNodeColor(label) }}>
            <div className="legend-diamond-after" style={{ borderTopColor: getNodeColor(label) }} />
          </div>
        );
      } else if (shape === "star") {
        return (
          <div className="legend-star" style={{ color: getNodeColor(label) }}>
            <div className="legend-star-before" />
            <div className="legend-star-after" style={{ color: getNodeColor(label) }} />
          </div>
        );
      } else if (shape === "triangle") {
        return <div className="legend-triangle" style={{ borderBottomColor: getNodeColor(label) }} />;
      }

      return <div className="legend-img">IMG</div>;
    };

    const legendPanel =
      Object.keys(this.labelCount.nodes).length > 0 ? (
        <div
          className="legend"
          onMouseEnter={() => {
            this.setState({ checkboxVisible: "visible" });
          }}
          onMouseLeave={() => {
            this.setState({ checkboxVisible: "hidden" });
          }}
        >
          {Object.entries(this.labelCount.nodes).map((kv) => (
            <div key={"N#" + kv[0]} className="legend-row">
              <div className="legend-row-label">{kv[0]}</div>
              <div
                className="legend-row-legend"
                onClick={() => {
                  this.showSettingsDialog(true, kv[0]);
                }}
              >
                {getLegendDiv(kv[0])}
              </div>
              <div className="legend-row-count">{kv[1]}</div>
              <div className="legend-visible" style={{ visibility: this.state.checkboxVisible }}>
                <input
                  className="legend-checkbox"
                  type="checkbox"
                  defaultChecked
                  onChange={(e) => {
                    this.setNodesHidden(kv[0], !e.target.checked);
                  }}
                />
              </div>
            </div>
          ))}
          {Object.keys(this.labelCount.edges).length > 0 ? <hr /> : null}
          {Object.entries(this.labelCount.edges).map((kv) => (
            <div key={"E#" + kv[0]} className="legend-row">
              <div className="legend-row-label">{kv[0]}</div>
              <div
                className="legend-row-legend-edge"
                onClick={() => {
                  this.showSettingsDialog(false, kv[0]);
                }}
              >
                <div className="legend-edge" style={{ background: getEdgeColor(kv[0]) }} />
              </div>
              <div className="legend-row-count">{kv[1]}</div>
              <div className="legend-visible" style={{ visibility: this.state.checkboxVisible }}>
                <input
                  type="checkbox"
                  defaultChecked
                  onChange={(e) => {
                    this.setEdgesHidden(kv[0], !e.target.checked);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null;

    const settingsDialog = (
      <SlidePanel
        top={100}
        isShowing={this.state.settingsDialogVisible}
        title={intl("grapheye.vis.setting")}
        width={500}
        onClose={() => this.hideSettingsDialog()}
        onOk={() => {
          if (this.state.settingsDialogIsNode) {
            this.changeNodeSettings(this.state.settingsDialogLabel, this.state.settingsDialogData);
          } else {
            this.changeEdgeSettings(this.state.settingsDialogLabel, this.state.settingsDialogData);
          }
          settingsStorage.save(this.settings);
          this.hideSettingsDialog();
        }}
        onCancel={() => this.hideSettingsDialog()}
        onMaskClick={() => this.hideSettingsDialog()}
      >
        <SettingsPanel
          ref={(r) => {
            this.settingsRef_ = r;
          }}
          elementIsNode={this.state.settingsDialogIsNode}
          elementLabel={this.state.settingsDialogLabel}
          elementSettings={this.state.settingsDialogData}
          onChange={(s) => {
            let data = { ...this.state.settingsDialogData, ...s };
            this.setState({ settingsDialogData: data });
          }}
        ></SettingsPanel>
      </SlidePanel>
    );

    const toolbarSeparator = <div className="toolbar-separator toolbar-btn"></div>;

    const toolbar = (
      <div className="toolbar">
        <div className="toolbar-btn">
          <Balloon.Tooltip
            trigger={
              <Button
                size="small"
                onClick={() => {
                  this.buildGraphSchema();
                }}
              >
                <Icon type="chart-relation" />
              </Button>
            }
            align="br"
          >
            展示Schema信息
          </Balloon.Tooltip>
        </div>
        <div className="toolbar-btn">
          <Select
            size="small"
            name="layout"
            defaultValue={Defaults.layout}
            label="布局"
            onChange={(v) => this.changeLayout(v)}
            style={{ width: "120px" }}
          >
            <Select.Option value="random">随机</Select.Option>
            <Select.Option value="force">力导向</Select.Option>
            <Select.Option value="radial">辐射</Select.Option>
            <Select.Option value="dagreTB">层次(上下)</Select.Option>
            <Select.Option value="dagreLR">层次(左右)</Select.Option>
            <Select.Option value="circular">环形</Select.Option>
            <Select.Option value="grid">网格</Select.Option>
          </Select>
        </div>
        <div className="toolbar-btn">
          <Balloon.Tooltip
            trigger={
              <Button size="small" onClick={() => this.reLayout()}>
                <Icon type="refresh" />
              </Button>
            }
            align="br"
          >
            重新布局
          </Balloon.Tooltip>
        </div>
        <div className="toolbar-btn">
          <Balloon.Tooltip
            trigger={
              <Button size="small" onClick={() => this.zoomExtends()}>
                <Icon type="expand-alt" />
              </Button>
            }
            align="br"
          >
            适应画布
          </Balloon.Tooltip>
        </div>
        <div className="toolbar-btn">
          <Balloon.Tooltip
            trigger={
              <Button size="small" onClick={() => this.downloadImage()}>
                <Icon type="picture" />
              </Button>
            }
            align="br"
          >
            保存图片
          </Balloon.Tooltip>
        </div>
        {toolbarSeparator}
        <div className="toolbar-btn" style={{ height: "10px" }}>
          <Search
            style={{ width: "200px" }}
            hasClear
            placeholder={intl("grapheye.vis.search.input.placeholder")}
            dataSource={this.state.searchIndex}
            onSearch={(value) => this.searchOnGraph(value)}
          />
        </div>
        <div className="toolbar-btn">
          <Balloon.Tooltip
            trigger={
              <Button size="small" onClick={() => this.searchResultShowPrev()}>
                <Icon type="arrow-left" />
              </Button>
            }
            align="br"
          >
            上一个
          </Balloon.Tooltip>
        </div>
        <div className="toolbar-btn">
          <Balloon.Tooltip
            trigger={
              <Button size="small" onClick={() => this.searchResultShowNext()}>
                <Icon type="arrow-right" />
              </Button>
            }
            align="br"
          >
            下一个
          </Balloon.Tooltip>
        </div>
        <div className="toolbar-btn">
          <Balloon.Tooltip
            trigger={
              <Button size="small" onClick={() => this.searchResultClear()}>
                <Icon type="close" />
              </Button>
            }
            align="br"
          >
            清空搜索结果
          </Balloon.Tooltip>
        </div>
        <div className="toolbar-btn">
          <Balloon.Tooltip
            trigger={
              <Button
                size="small"
                onClick={() => {
                  window.open(docUrl, "_blank");
                }}
              >
                <Icon type="question-circle" />
              </Button>
            }
            align="br"
          >
            帮助文档
          </Balloon.Tooltip>
        </div>
      </div>
    );

    const graphVisCard = (
      <div>
        {legendPanel}
        <GraphVis
          ref={(graphVis) => {
            this.graphVis_ = graphVis;
          }}
          getNodePropertyCallback={(selectId, callback) => this.getNodePropertiesBatch(selectId, callback)}
          getEdgePropertyCallback={(selectId, callback) => this.getEdgePropertiesBatch(selectId, callback)}
          showPropertyCallback={(elementType, elementId, elementLabel, graphData) => {
            if (graphData !== undefined) {
              this.updatePropertysState(elementType, elementId, elementLabel, graphData);
            }
          }}
          getOutEdgesCallback={(selectId, isOut, callback) => this.getOutEdges(selectId, isOut, callback)}
          graphChangedCallback={(graphData) => {
            this.labelCount = this.createLabelCount(graphData);
            this.updateGraphData(graphData);
          }}
          nodeVisOptions={this.settings.node}
          edgeVisOptions={this.settings.edge}
          canvasHeight={graphVisHeight}
        />
      </div>
    );

    const tableCard = <TableView rows={this.state.rows} height={mainViewHeight} ap={this.state.isAp}/>;

    const logCard = (
      <LogView
        logRecords={this.state.logRecords}
        height={mainViewHeight - 45}
        onRetry={(dsl) => {
          this.gremlinInput_.setValue(dsl);
          this.handleSubmitDSL(dsl);
        }}
      />
    );

    const cardProps = {
      extra: (
        <Button
          type="primary"
          disabled={this.state.selectedId == null}
          text
          onClick={() => {
            this.showPropertyEditDialog();
          }}
        >
          {intl("grapheye.vis.label.property.card.edit")}{" "}
        </Button>
      ),
    };

    const propertyCard = (
      <Card
        title={intl("grapheye.vis.label.property.card.title")}
        contentHeight={mainViewHeight}
        showHeadDivider={false}
        {...cardProps}
      >
        <div className="property-header">
          <div className="col-key">
            <div>ID:</div>
            <div>Label:</div>
          </div>
          <div className="col-value">
            <div title={this.state.selectedId}>{this.state.selectedId}</div>
            <div title={this.state.selectedLabel}>{this.state.selectedLabel}</div>
          </div>
        </div>
        <Table
          style={{ lineHeight: "14px" }}
          fixedHeader
          dataSource={this.state.propertys}
          tableLayout="fixed"
          maxBodyHeight={tableHeightPx}
        >
          <Table.Column title="Key" dataIndex="key" />
          <Table.Column
            title="Value"
            dataIndex="value"
            cell={(value) => (typeof value === "boolean" ? value.toString() : value)}
          />
        </Table>
      </Card>
    );

    const opButtonProps = (disabled) => {
      return {
        type: "button",
        class: "next-btn next-btn-normal next-btn-text",
      };
    };

    const renderRowOps = (value, index, record) => {
      return (
        <div>
          <button
            disabled={record.deleted}
            onClick={() => {
              this.showPropertyInputDialog(record);
            }}
            {...opButtonProps(record.deleted)}
          >
            <span className="next-btn-helper">
              {" "}
              <Icon type="edit" size="xs" />{" "}
            </span>
          </button>
          <button
            disabled={record.deleted}
            onClick={() => {
              this.handleDeleteProperty(record);
            }}
            {...opButtonProps(record.deleted)}
          >
            <span className="next-btn-helper">
              {" "}
              <Icon type="delete" size="xs" />{" "}
            </span>
          </button>
          <button
            disabled={record.oldData == null && !record.deleted}
            onClick={() => {
              this.handleRestoreProperty(record);
            }}
            {...opButtonProps(record.oldData == null && !record.deleted)}
          >
            <span className="next-btn-helper">
              {" "}
              <Icon type="undo" size="xs" />{" "}
            </span>
          </button>
        </div>
      );
    };

    const newRowProps = {
      className: "delete-row-class",
      style: { backgroundColor: "rgb(245, 255, 250, 0.5)" },
    };

    const deletedRowProps = {
      className: "delete-row-class",
      style: { backgroundColor: "rgb(220, 220, 220, 0.5)" },
    };

    const modifiedRowProps = {
      className: "modified-row-class",
      style: { backgroundColor: "rgb(255, 245, 238, 0.5)" },
    };

    const setRowProps = (record, index) => {
      if (record.new) {
        return newRowProps;
      } else if (record.deleted) {
        return deletedRowProps;
      } else if (record.oldData) {
        return modifiedRowProps;
      }
    };

    const propertyEditDialog = (
      <Dialog
        title={intl("grapheye.vis.propertyEdit.dialog")}
        visible={this.state.propertyEditDialogVisible}
        onCancel={() => this.hidePropertyEditDialog()}
        onClose={() => this.hidePropertyEditDialog()}
        // stickyHeader
        footer={
          <div>
            <Button
              type="normal"
              onClick={() => {
                this.showPropertyInputDialog();
              }}
            >
              添加
            </Button>
            <Button
              type="normal"
              onClick={() => {
                this.handleSubmitPropertyUpdates();
              }}
            >
              确定
            </Button>
            <Button
              type="normal"
              onClick={() => {
                this.hidePropertyEditDialog();
              }}
            >
              取消
            </Button>
          </div>
        }
      >
        <Table
          style={{ lineHeight: "14px" }}
          dataSource={this.state.editPropertyData}
          maxBodyHeight={tableHeightPx}
          rowProps={setRowProps}
        >
          <Table.Column title="Key" dataIndex="key" />
          <Table.Column title="Value" dataIndex="value" />
          <Table.Column title="操作" cell={renderRowOps} />
        </Table>
      </Dialog>
    );

    const propertyInputDialog = (
      <Dialog
        title={intl("grapheye.vis.propertyInput.dialog")}
        visible={this.state.propertyInputDialogVisible}
        okProps={{ disabled: this.state.propertyInputKey === "" }}
        onOk={() => this.hidePropertyInputDialog(true)}
        onCancel={() => this.hidePropertyInputDialog(false)}
        onClose={() => this.hidePropertyInputDialog(false)}
      >
        <p>
          <Input
            placeholder="key"
            value={this.state.propertyInputKey}
            label={"  Key"}
            style={{ width: 300 }}
            onChange={(value, event) => {
              this.setState({ propertyInputKey: value });
            }}
            readOnly={this.state.propertyInputIsModify}
          />
        </p>
        <p>
          <Select
            id="input-value"
            value={this.state.propertyInputValueType}
            aria-label="type"
            label=" Type"
            style={{ width: 300 }}
            onChange={(type) => {
              this.propertyInputChangeValueType(type);
            }}
          >
            <Select.Option value="string">字符串</Select.Option>
            <Select.Option value="number">数值</Select.Option>
            <Select.Option value="boolean">布尔</Select.Option>
          </Select>
        </p>
        {this.state.propertyInputValueType !== "boolean" && (
          <p>
            <Input
              placeholder="value"
              value={this.state.propertyInputValue}
              label={" Value"}
              style={{ width: 300 }}
              onChange={(value, event) => {
                this.setState({ propertyInputValue: value });
              }}
            />
          </p>
        )}
        {this.state.propertyInputValueType === "boolean" && (
          <p>
            <Select
              id="input-bool-value"
              value={this.state.propertyInputValue}
              aria-label="bool value"
              label="Value"
              style={{ width: 300 }}
              onChange={(value, event) => {
                this.setState({ propertyInputValue: value });
              }}
            >
              <Select.Option value={true}>true</Select.Option>
              <Select.Option value={false}>false</Select.Option>
            </Select>
          </p>
        )}
      </Dialog>
    );

    const leftPanel = (
      <Card contentHeight={mainViewHeight} showHeadDivider={false} title="操作面板">
        <Tree
          defaultExpandAll
          isNodeBlock={{ defaultPaddingLeft: 0 }}
          selectedKeys={[this.state.selectedAlgo]}
          onSelect={(keys, extra) => {
            if (keys.length > 0 && typeof keys[0] === "string" && !keys[0].startsWith("cat-")) {
              this.setState({ selectedAlgo: keys[0] });
            } else {
              this.setState({ selectedAlgo: null });
            }
          }}
          dataSource={this.algorithmTree}
        />
      </Card>
    );

    const parameterPanel =
      this.state.selectedAlgo !== null ? (
        <div className="param-panel">
          <div className="param-input">
            <ParameterInput
              parameters={this.algorithmTemplate[this.state.selectedAlgo].parameters}
              onSubmit={(p) => {
                const algo = this.algorithmTemplate[this.state.selectedAlgo];
                for (const [k, v] of Object.entries(algo.parameters)) {
                  if (!v.optional && p[k] === undefined) {
                    console.log("missing required parameter: ", v.name);
                    Message.error("缺少必填参数: " + v.name);
                    return;
                  }
                }
                const s = eval(algo.template);
                this.gremlinInput_.setValue(s);
                this.setState({ selectedAlgo: null });
                if (algo.preferredLayout !== undefined) {
                  this.changeLayout(algo.preferredLayout);
                }
                this.handleSubmitDSL(s);
              }}
              onCancel={() => {
                this.setState({ selectedAlgo: null });
              }}
            ></ParameterInput>
          </div>
          {/* <div>算法说明</div> */}
        </div>
      ) : null;

    const queryInput = (
      <Card contentHeight={"30px"}>
        <div className="dslInput">
          <div className="inputLine gremlinInput">
            <QueryInput
              ref={(gremlinInput) => {
                this.gremlinInput_ = gremlinInput;
              }}
              placeholder={intl("grapheye.dsl.input.placeholder")}
              onEnter={() => {
                if (this.state.connected) {
                  this.handleSubmitDSL(this.gremlinInput_.getValue());
                } else {
                  this.showConnectDialog();
                }
              }}
              defaultValue={defaultDSL}
            />
          </div>
          <div className="inputLine">
            <Button
              disabled={!this.state.connected}
              onClick={() => this.handleSubmitDSL(this.gremlinInput_.getValue())}
            >
              {intl("grapheye.dsl.submit")}
            </Button>
          </div>
        </div>
        {parameterPanel}
      </Card>
    );

    const footerButtons = (
      <div className="card-footer">
        <button
          className="footer-btn"
          style={{ width: "100px" }}
          onClick={() => {
            this.showConnectDialog();
          }}
        >
          <div style={{ display: "flex" }}>
            {this.state.connected ? (
              <Icon type="success" size="xs" style={{ color: "#1DC11D", marginRight: "5px", marginTop: "0" }} />
            ) : (
              <Icon type="exclamationcircle-f" size="xs" style={{ color: "red", marginRight: "5px" }} />
            )}
            <div style={{ margin: "auto" }}>{this.state.connected ? "已连接" : "点击连接"}</div>
          </div>
        </button>
        <button
          className="footer-btn"
          disabled={this.state.viewType === "graph"}
          onClick={() => {
            this.onViewChange("graph");
          }}
        >
          图形
        </button>
        <button
          className="footer-btn"
          disabled={this.state.viewType === "table"}
          onClick={() => {
            this.onViewChange("table");
          }}
        >
          表格
        </button>
        <button
          className="footer-btn"
          disabled={this.state.viewType === "log"}
          onClick={() => {
            this.onViewChange("log");
          }}
        >
          日志
        </button>
      </div>
    );

    return (
      <div>
        <Loading visible={this.state.loadingVisible} fullScreen>
          <div className="left-area">{leftPanel}</div>
          <div className="right-area">{propertyCard}</div>
          <div className="query-input">{queryInput}</div>
          <div className="main-area">
            <Card
              contentHeight={graphVisHeight}
              // actions={footerButtons}
            >
              <div style={{ display: this.isGraphView() ? "block" : "none" }}>
                {toolbar}
                {graphVisCard}
              </div>
              <div style={{ display: this.isTableView() ? "block" : "none" }}>{tableCard}</div>
              <div style={{ display: this.isLogView() ? "block" : "none" }}>{logCard}</div>
              {footerButtons}
            </Card>
          </div>
          {propertyEditDialog}
          {propertyInputDialog}
          {connectDialog}
          {settingsDialog}
          {nodePickDialog}
        </Loading>
      </div>
    );
  }
}

export default GraphZone;
