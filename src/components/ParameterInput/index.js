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
import { Button, Form, Input, Select } from "@alicloud/console-components";

import "./index.css";

class ParameterInput extends React.Component {
  render() {
    const params = Object.entries(this.props.parameters).map((e) => (
      <Form.Item key={e[0]}>
        {e[1].candidates ? (
          <Select name={e[0]} defaultValue={e[1].candidates[0]}>
            {e[1].candidates.map((c) => (
              <Select.Option key={c} value={c}>
                {c}
              </Select.Option>
            ))}
          </Select>
        ) : (
          <Input type="text" name={e[0]} placeholder={e[1].name} />
        )}
      </Form.Item>
    ));
    return (
      <Form>
        {params}
        <Form.Item>
          <Form.Submit
            onClick={(v) => {
              this.props.onSubmit(v);
            }}
          >
            确定
          </Form.Submit>
        </Form.Item>
        <Form.Item>
          <Form.Reset>重置</Form.Reset>
        </Form.Item>
        <Form.Item>
          <Button onClick={this.props.onCancel}>取消</Button>
        </Form.Item>
      </Form>
    );
  }
}

ParameterInput.propTypes = {
  parameters: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ParameterInput;
