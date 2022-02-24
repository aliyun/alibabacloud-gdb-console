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

import { Arrow } from "@antv/g6";

class Defaults {
  static nodeLabelCfg = {
    style: {
      fill: "#000000E6",
      fontSize: 10,
    },
    position: "bottom",
  };

  static edgeLabelCfg = {
    refY: 5,
    autoRotate: true,
    style: {
      fill: "#000000A6",
      fontSize: 10,
    },
  };

  static lineDashCfg = [5, 10, 5];

  // layout参数，参考：
  //   https://antv-g6.gitee.io/zh/docs/api/layout/Graph
  static layoutOptions = {
    random: { type: "random" },
    force: {
      type: "force",
      linkDistance: 60,
      preventOverlap: true,
      nodeSize: 40,
      nodeSpacing: 20,
      alphaDecay: 0.084,
    },
    radial: {
      type: "radial",
      nodeSpacing: 20,
      preventOverlap: true,
      nodeSize: 40,
      linkDistance: 60,
    },
    dagreTB: { type: "dagre", rankdir: "TB", nodesep: 5 },
    dagreLR: { type: "dagre", rankdir: "LR", nodesep: 5 },
    concentric: {
      type: "concentric",
      preventOverlap: true,
      nodeSize: 40,
      minNodeSpacing: 30,
    },
    grid: {
      type: "grid",
      preventOverlap: true,
      nodeSize: 40,
      preventOverlapPadding: 80,
      condense: true,
    },
    circular: {
      type: "circular",
      preventOverlap: true,
      nodeSize: 40,
      preventOverlapPadding: 80,
      radius: 200,
    },
  };

  // eslint-disable-next-line no-plusplus
  static presetNodeColors = [
    "#9481F5",
    "#4979F6",
    "#00BAE8",
    "#77C9BD",
    "#2BAE31",
    "#FFBC2E",
    "#FF922E",
    "#F77B79",
    "#EF83DB",
  ];
  static presetEdgeColors = [
    "#92AFFA",
    "#F1948A",
    "#D2B4DE",
    "#AED6F1",
    "#AED6F1",
    "#ABEBC6",
    "#F9E79F",
    "#F5CBA7",
    "#E5E7E9",
    "#CCD1D1",
    "#ABB2B9",
  ];

  static nodeSize = 25;
  static autoNodeSizeMin = this.nodeSize;
  static autoNodeSizeMax = this.nodeSize * 2;

  static nodeStyles = {
    circle: {
      type: "circle",
      labelCfg: this.nodeLabelCfg,
      style: {
        lineWidth: 0,
      },
      size: this.nodeSize,
    },
    ellipse: {
      type: "ellipse",
      labelCfg: this.nodeLabelCfg,
      style: {
        lineWidth: 0,
      },
      size: this.nodeSize,
    },
    box: {
      type: "rect",
      labelCfg: this.nodeLabelCfg,
      style: {
        lineWidth: 0,
        radius: 3,
      },
      size: this.nodeSize,
    },
    diamond: {
      type: "diamond",
      labelCfg: this.nodeLabelCfg,
      style: {
        lineWidth: 0,
      },
      size: this.nodeSize,
    },
    star: {
      type: "star",
      labelCfg: this.nodeLabelCfg,
      style: {
        lineWidth: 0,
      },
      size: this.nodeSize,
    },
    triangle: {
      type: "triangle",
      labelCfg: this.nodeLabelCfg,
      style: {
        lineWidth: 0,
      },
      size: this.nodeSize,
    },
    image: {
      type: "image",
      labelCfg: this.nodeLabelCfg,
      size: this.nodeSize,
    },
  };

  static endArrowPath = Arrow.triangle(4, 5);

  static commonEdgeStyle = {
    lineWidth: 1,
    startArrow: false,
    stroke: this.presetEdgeColors[0],
  };

  static edgeStyles = {
    line: {
      type: "line",
      labelCfg: this.edgeLabelCfg,
      style: {
        ...this.commonEdgeStyle,
      },
    },
    polyline: {
      type: "polyline",
      labelCfg: this.edgeLabelCfg,
      style: {
        ...this.commonEdgeStyle,
        radius: 5,
      },
    },
    quadratic: {
      type: "quadratic",
      labelCfg: this.edgeLabelCfg,
      style: {
        ...this.commonEdgeStyle,
      },
    },
    cubic: {
      type: "cubic",
      labelCfg: this.edgeLabelCfg,
      style: {
        ...this.commonEdgeStyle,
      },
    },
    loop: {
      type: "loop",
      labelCfg: this.edgeLabelCfg,
      style: {
        ...this.commonEdgeStyle,
      },
    },
  };

  static layout = "force";

  static nodeSettings = {
    text: "id",
    nodeShape: "circle",
    // nodeColor: "#4a90e2",
    nodeImageType: "imageUrl",
    nodeSize: "autoResizeDisabled",
  };

  static edgeSettings = {
    text: "label",
    lineType: "line",
    lineDash: false,
    lineArrow: true,
    lineColor: this.presetEdgeColors[0],
  };

  static defaultLayout() {
    return this.layoutOptions[this.layout];
  }

  static nodeColorIndex = 0;
  static edgeColorIndex = 0;

  static defaultNodeCfg() {
    const cfg = {
      text: "id",
      nodeShape: "circle",
      nodeColor: this.presetNodeColors[this.nodeColorIndex],
      nodeSize: "autoResizeDisabled",
    };
    ++this.nodeColorIndex;
    if (this.nodeColorIndex >= this.presetNodeColors.length) {
      this.nodeColorIndex = 0;
    }
    return cfg;
  }

  static defaultEdgeCfg() {
    const cfg = {
      lineType: "line",
      lineColor: this.presetEdgeColors[this.edgeColorIndex],
      lineDash: false,
      lineArrow: true,
    };
    ++this.edgeColorIndex;
    if (this.edgeColorIndex >= this.presetEdgeColors.length) {
      this.edgeColorIndex = 0;
    }

    return cfg;
  }
}

export default Defaults;
