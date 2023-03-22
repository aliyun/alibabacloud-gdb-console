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
import { Pagination, Table } from "@alicloud/console-components";
import PropTypes from "prop-types";

import "./index.css";

class TableView extends React.Component {
  constructor(props) {
    super(props);
    const currentPage = 1;
    const pageSize = 10;
    this.state = {
      pageSize: pageSize,
      currentPage: currentPage,
    };
    this.columns = [];
    this.propColumns = [];
  }

  changePage(p) {
    this.setState({ currentPage: p });
  }

  changePageSize(pageSize) {
    this.setState({ pageSize: pageSize });
  }

  getColumnWidthPx(maxLen) {
    let width = 100;
    if (maxLen < 10) {
      width = 50;
    }
    return width;
  }

  getColumnText(col) {
    if (typeof col === "object") {
      return JSON.stringify(col);
    }
    return "" + col;
  }

  updateColumnWidth(columns, col, k) {
    let maxLen = columns[k];
    if (!maxLen) {
      maxLen = this.getColumnText(col).length;
    } else {
      maxLen = Math.max(maxLen, this.getColumnText(col).length);
    }
    columns[k] = maxLen;
  }

  collectColumns() {
    // find all columns
    const columns = {}; // column => max value length
    const propColumns = {};
    for (let i = 0; i < this.props.rows.length; i++) {
      if (typeof this.props.rows[i] !== "object") {
        // this.updateColumnWidth(columns, this.props.rows, "value");
        continue;
      }
      for (const k of Object.keys(this.props.rows[i])) {
        // if (k === "__rowIndex") {
        //     continue;
        // }
        if (k !== "properties") {
          this.updateColumnWidth(columns, this.props.rows[i][k], k);
          continue;
        }

        if (typeof this.props.rows[i].properties !== "object") {
          continue;
        }

        for (const p of Object.keys(this.props.rows[i].properties)) {
          if (p === "~id") {
            continue;
          }
          this.updateColumnWidth(propColumns, this.props.rows[i].properties[p], p);
        }
      }
    }
    this.columns = Object.keys(columns).length > 0 ? columns : null;
    this.propColumns = propColumns;
  }

  render() {
    this.columns = null;
    const dataSource = this.props.ap
      ? () => {
          const result = [];
          this.props.rows
            .slice((this.state.currentPage - 1) * this.state.pageSize, this.state.currentPage * this.state.pageSize)
            .forEach((element) => {
              if ("key" in element && "value" in element) {
                result.push(element);
              } else {
                result.push({ key: Object.keys(element)[0], value: JSON.stringify(Object.values(element)[0]) });
              }
            });
          return result;
        }
      : () => {
          return this.props.rows.slice(
            (this.state.currentPage - 1) * this.state.pageSize,
            this.state.currentPage * this.state.pageSize
          );
        };
    if (this.props.ap) {
      this.columns = { key: true, value: true };
    } else {
      this.collectColumns();
    }
    return (
      <div className="table-view">
        <Table
          dataSource={dataSource()}
          size="small"
          tableLayout="auto"
          fixedHeader
          maxBodyHeight={this.props.height - 100}
        >
          {this.columns ? (
            Object.keys(this.columns).map((k) => (
              <Table.Column
                key={k}
                dataIndex={k}
                title={
                  <div title={k} className="table-cell" style={{ width: this.getColumnWidthPx(this.columns[k]) }}>
                    {k}
                  </div>
                }
                cell={(value, index, record) => {
                  const content = k in record ? this.getColumnText(record[k]) : "";
                  return (
                    <div
                      title={content}
                      className="table-cell"
                      style={{ width: this.getColumnWidthPx(this.columns[k]) }}
                    >
                      {content}
                    </div>
                  );
                }}
              />
            ))
          ) : (
            <Table.Column
              title={<div className="table-cell">value</div>}
              cell={(value, index, record) => {
                const content = record;
                return (
                  <div title={content} className="table-cell">
                    {content}
                  </div>
                );
              }}
            />
          )}
          {Object.keys(this.propColumns).map((k) => (
            <Table.Column
              key={k}
              dataIndex={"properties." + k}
              title={
                <div title={k} className="table-cell" style={{ width: this.getColumnWidthPx(this.propColumns[k]) }}>
                  {k}
                </div>
              }
              cell={(value, index, record) => {
                const content =
                  record["properties"] !== undefined && k in record.properties
                    ? this.getColumnText(record.properties[k])
                    : "";
                return (
                  <div
                    title={content}
                    className="table-cell"
                    style={{ width: this.getColumnWidthPx(this.propColumns[k]) }}
                  >
                    {content}
                  </div>
                );
              }}
            />
          ))}
        </Table>
        <Pagination
          size="small"
          total={this.props.rows.length}
          current={this.state.currentPage}
          pageSize={this.state.pageSize}
          pageSizeSelector="dropdown"
          pageSizeList={[5, 10, 20, 50]}
          onChange={(p) => this.changePage(p)}
          onPageSizeChange={(s) => this.changePageSize(s)}
          className="table-pagination"
        />
      </div>
    );
  }
}

TableView.propTypes = {
  rows: PropTypes.array.isRequired,
  height: PropTypes.number.isRequired,
};

export default TableView;
