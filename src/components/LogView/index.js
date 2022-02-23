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
import PropTypes from "prop-types";

import "./index.css";

class LogView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: null,
    };
  }

  getKey(r) {
    return r.eventTime + r.eventType;
  }

  render() {
    const Tag = (props) => {
      return (
        <div className="log-event-tag" style={{ background: props.background, color: "#515a5a" }}>
          {props.text}
        </div>
      );
    };

    const tagMap = {
      // req: <Icon type="prompt" size="small" style={{ color: "rgba(255, 255, 0, 0.6)" }} />,
      // rsp: <Icon type="success" size="small" style={{ color: "rgba(0, 128, 0, 0.6)" }} />,
      // err: <Icon type="error" size="small" style={{ color: "rgba(255, 0, 0, 0.6)" }} />,
      req: <Tag background="rgba(255, 255, 0, 0.6)" text="请求" />,
      rsp: <Tag background="rgba(0, 128, 0, 0.6)" text="响应" />,
      err: <Tag background="rgba(255, 0, 0, 0.6)" text="错误" />,
    };

    return (
      <div
        style={{
          overflow: "auto",
          height: this.props.height,
          fontFamily: "Lucida Console",
          fontSize: "12px",
        }}
      >
        {this.props.logRecords.map((r) => (
          <div className="log-line" key={`${r.eventType}#${r.eventTime}`}>
            <div className="log-event-type">{tagMap[r.eventType]}</div>
            <div className="log-event-time log-field">{r.eventTime}</div>
            <div className="log-field log-op">
              {r.extra ? (
                <a
                  href="javascript:void(0)"
                  onClick={() => {
                    const key = this.getKey(r);
                    if (this.state.expanded === key) {
                      this.setState({ expanded: null });
                    } else {
                      this.setState({ expanded: key });
                    }
                  }}
                >
                  详情
                </a>
              ) : null}
              {r.eventType === "req" ? (
                <a
                  href="javascript:void(0)"
                  onClick={() => {
                    if (this.props.onRetry) {
                      this.props.onRetry(r.content);
                    }
                  }}
                >
                  重试
                </a>
              ) : null}
            </div>
            <div className="log-field log-content">{r.content}</div>
            <div className="log-detail" style={{ display: this.state.expanded === this.getKey(r) ? "block" : "none" }}>
              {r.extra}
            </div>
          </div>
        ))}
      </div>
    );
  }
}

LogView.propTypes = {
  logRecords: PropTypes.array.isRequired,
  height: PropTypes.number.isRequired,
  onRetry: PropTypes.func,
};

export default LogView;
