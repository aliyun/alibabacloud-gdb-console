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

export default class IpcRequest {
  submitDSL(dsl, onSuccess, onFailure) {
    window._ipcRenderer
      .invoke("query", dsl)
      .then((response) => {
        if (response.success === true) {
          onSuccess(response.data);
        } else {
          console.log("query failed:", response.data);
          onFailure(response.data);
        }
      })
      .catch((error) => {
        console.log("query error:", error);
        onFailure({ status: -1, msg: "" + error });
      });
  }

  async submit(dsl) {
    return new Promise((resolve, reject) => {
      window._ipcRenderer
        .invoke("query", dsl)
        .then((response) => {
          if (response.success === true) {
            resolve(response.data);
          } else {
            console.log("query failed:", response.data);
            reject(response.data);
          }
        })
        .catch((error) => {
          console.log("query error:", error);
          reject({ status: -1, msg: "" + error });
        });
    });
  }

  connect(connInfo, onSuccess, onFailure) {
    window._ipcRenderer
      .invoke("set-connection", connInfo)
      .then((response) => {
        if (response.success === true) {
          onSuccess();
        } else {
          console.log("connect failed:", response.data);
          onFailure(response.data);
        }
      })
      .catch((error) => {
        console.log("connect error:", error);
        onFailure({ status: -1, msg: error });
      });
  }
}
