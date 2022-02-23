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

import axios from "axios";

export default class Request {
  submitDSL(dsl, onSuccess, onFailure) {
    let type = "cypher";
    if (dsl.startsWith("g.") | dsl.startsWith("graph.compute")) {
      type = "gremlin";
    }
    axios
      .post("/api/v2/query", { type: type, dsl: dsl })
      .then((response) => {
        onSuccess(response.data);
      })
      .catch((error) => {
        console.log("error: ", error);
        if (typeof error.response === "object") {
          onFailure(error.response);
        } else {
          onFailure({ status: -1, msg: "" + error });
        }
      });
  }

  async submit(dsl) {
    let type = "cypher";
    if (dsl.startsWith("g.") | dsl.startsWith("graph.compute")) {
      type = "gremlin";
    }

    return new Promise((resolve, reject) => {
      axios
        .post("/api/v2/query", { type: type, dsl: dsl })
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          if (typeof error.response === "object") {
            reject(error.response);
          } else {
            reject({ status: -1, msg: "" + error });
          }
        });
    });
  }

  connect(connInfo, onSuccess, onFailure) {
    axios
      .post("/api/v1/connect", {
        conn: connInfo,
      })
      .then((_) => {
        onSuccess();
      })
      .catch((error) => {
        console.log("connect failed:", error);
        if (typeof error.response === "object" && "status" in error.response) {
          onFailure({ status: error.response.status, msg: "" + error.response.data });
        } else {
          onFailure({ status: 500, msg: "" + error });
        }
      });
  }
}
