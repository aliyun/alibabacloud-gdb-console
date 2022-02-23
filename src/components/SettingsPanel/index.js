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

import React from "react";
import { Card, Checkbox, Input, Overlay, Radio, Select } from "@alicloud/console-components";
import { SketchPicker } from "react-color";
import PropTypes from "prop-types";

import "./index.css";
import Defaults from "../../utils/Defaults";

class SettingsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      colorPickerVisible: false,
    };
    this.colorPickerRef = React.createRef();
  }

  render() {
    const cardProps = {
      showHeadDivider: false,
      showTitleBullet: false,
    };

    const settings = this.props.elementSettings;
    const textSetting = (
      <Card key="text" title="文本" contentHeight="50px" {...cardProps}>
        <Input.Group
          addonBefore={
            <Select
              aria-label="please select"
              defaultValue={settings.text}
              onChange={(v) => {
                this.props.onChange({ text: v });
              }}
            >
              <Select.Option value="label">标签</Select.Option>
              <Select.Option value="id">ID</Select.Option>
              <Select.Option value="property">属性</Select.Option>
              <Select.Option value="blank">空白</Select.Option>
              <Select.Option value="custom">自定义</Select.Option>
            </Select>
          }
        >
          <Input
            disabled={settings.text !== "property" && settings.text !== "custom"}
            defaultValue={settings.textValue}
            style={{ width: "100%" }}
            aria-label="please input"
            onBlur={(e) => {
              this.props.onChange({ textValue: e.target.value });
            }}
          />
        </Input.Group>
      </Card>
    );

    const colorPicker = (
      <div>
        <div className="color-picker-swatch" style={{ width: "100%" }}>
          <Input
            ref={this.colorPickerRef}
            value={settings.nodeColor}
            addonTextBefore="颜色"
            onFocus={() => {
              this.setState({ colorPickerVisible: true });
            }}
            addonAfter={
              <div
                className="color-picker-button"
                style={{
                  background: `${settings.nodeColor}`,
                }}
              />
            }
          />
          <Overlay
            visible={this.state.colorPickerVisible}
            target={() => this.colorPickerRef.current}
            safeNode={() => this.colorPickerRef.current}
          >
            <div className="color-picker-popover">
              <div
                className="color-picker-cover"
                onClick={() => {
                  this.setState({ colorPickerVisible: false });
                }}
              />
              <SketchPicker
                color={settings.nodeColor}
                presetColors={Defaults.presetNodeColors}
                onChange={(v) => {
                  this.props.onChange({ nodeColor: v.hex });
                }}
              />
            </div>
          </Overlay>
        </div>
      </div>
    );

    const imageInput = (
      <div>
        <Input.Group
          style={{ padding: "5px 1px 0px 1px" }}
          addonBefore={
            <Select
              disabled={settings.nodeShape !== "image"}
              defaultValue={settings.nodeImageType}
              onChange={(v) => this.props.onChange({ nodeImageType: v })}
              autoWidth={false}
            >
              <Select.Option value="imageUrl">URL</Select.Option>
              <Select.Option value="imageProp">属性</Select.Option>
            </Select>
          }
        >
          <Input
            style={{ width: "100%" }}
            defaultValue={settings.nodeImageType === "imageUrl" ? settings.nodeImageUrl : settings.nodeImageProp}
            placeholder={settings.nodeImageType === "imageUrl" ? "输入图片URL" : "输入包含图片URL的属性名"}
            onBlur={(e) => {
              if (settings.nodeImageType === "imageUrl") {
                this.props.onChange({ nodeImageUrl: e.target.value });
              } else {
                this.props.onChange({ nodeImageProp: e.target.value });
              }
            }}
          />
        </Input.Group>
        <div className="setting-notice">提示：设置节点显示为图片需要图片所在服务器支持跨域访问，否则无法正常显示。</div>
      </div>
    );

    const shapeSetting = (
      <Card key="shape" title={"图形"} contentHeight="300px" {...cardProps}>
        <Radio.Group
          name="shape"
          defaultValue={settings.nodeShape}
          onChange={(v) => this.props.onChange({ nodeShape: v })}
        >
          <Radio value="circle">圆形</Radio>
          <Radio value="box">矩形</Radio>
          <Radio value="diamond">菱形</Radio>
          <Radio value="star">星形</Radio>
          <Radio value="triangle">三角形</Radio>
          <Radio value="image">图片</Radio>
        </Radio.Group>
        {settings.nodeShape === "image" ? imageInput : colorPicker}
      </Card>
    );

    const sizeSetting = (
      <Card key="size" title="大小" contentHeight="50px" {...cardProps}>
        <Radio.Group
          name="autoResizeStrategy"
          direction="hoz"
          defaultValue={settings.nodeSize}
          onChange={(v) => this.props.onChange({ nodeSize: v })}
        >
          <Radio value="autoResizeDisabled">默认</Radio>
          <Radio value="autoResizeByEdgesCount">按照边数调整大小</Radio>
          <Radio value="autoResizeByProperty">按照属性值调整大小</Radio>
        </Radio.Group>
        <Input
          disabled={settings.nodeSize !== "autoResizeByProperty"}
          name="autoResizePropertyName"
          addonTextBefore="属性名"
          style={{ paddingTop: "5px" }}
          defaultValue={"autoResizePropertyName" in settings ? settings.autoResizePropertyName : ""}
          onBlur={(e) => {
            this.props.onChange({ autoResizePropertyName: e.target.value });
          }}
        />
      </Card>
    );

    const lineSetting = (
      <Card key="line" title="线条" contentHeight="50px" {...cardProps}>
        <div className="line-settings-container">
          <span className="line-settings-label">线条类型</span>
          <Radio.Group
            name="lineType"
            direction="hoz"
            defaultValue={settings.lineType}
            onChange={(v) => this.props.onChange({ lineType: v })}
          >
            <Radio value="line">直线</Radio>
            <Radio value="polyline">折线</Radio>
            <Radio value="quadratic">弧线</Radio>
            <Radio value="cubic">贝塞尔曲线</Radio>
          </Radio.Group>
        </div>
        <div className="line-settings-container">
          <span className="line-settings-label">线条颜色</span>
          <div
            className="color-picker-button"
            style={{ height: "20px", background: settings.lineColor }}
            onClick={() => {
              this.setState({ colorPickerVisible: true });
            }}
            ref={this.colorPickerRef}
          />
          <Overlay
            visible={this.state.colorPickerVisible}
            target={() => this.colorPickerRef.current}
            safeNode={() => this.colorPickerRef.current}
          >
            <div className="color-picker-popover">
              <div
                className="color-picker-cover"
                onClick={() => {
                  this.setState({ colorPickerVisible: false });
                }}
              />
              <SketchPicker
                color={settings.lineColor}
                presetColors={Defaults.presetEdgeColors}
                onChange={(v) => {
                  this.props.onChange({ lineColor: v.hex });
                }}
              />
            </div>
          </Overlay>
        </div>
        <div className="line-settings-container">
          <div style={{ width: "50%" }}>
            <span className="line-settings-label">使用虚线</span>
            <Checkbox checked={settings.lineDash} onChange={(v) => this.props.onChange({ lineDash: v })} />
          </div>
          <div>
            <span className="line-settings-label">显示箭头</span>
            <Checkbox checked={settings.lineArrow} onChange={(v) => this.props.onChange({ lineArrow: v })} />
          </div>
        </div>
      </Card>
    );

    let settingList = null;
    if (this.props.elementIsNode) {
      settingList = [textSetting, shapeSetting, sizeSetting];
    } else {
      settingList = [textSetting, lineSetting];
    }

    return <div>{settingList}</div>;
  }
}

SettingsPanel.propTypes = {
  elementIsNode: PropTypes.bool.isRequired,
  elementSettings: PropTypes.object.isRequired, // current config
  onChange: PropTypes.func.isRequired,
};

export default SettingsPanel;
