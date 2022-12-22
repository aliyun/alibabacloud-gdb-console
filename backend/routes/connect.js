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

const express = require("express");
const axios = require("axios");
var router = express.Router();

router.post("/", function (req, res, next) {
  var connInfo = null;
  if (req.body.conn != undefined) {
    // FIXME: password should be encrypted, if in insecure context(http)
    connInfo = req.body.conn;
  } else if (req.session != undefined && req.session.conn != undefined) {
    connInfo = req.session.conn;
  }
  if (connInfo === null) {
    res.status(401).end();
    return;
  }
  var url = `ws://${connInfo.host}:${connInfo.port}/gremlin`;
  if (connInfo.dbname !== null && connInfo.dbname !== undefined && connInfo.dbname !== '' ) {
    url =  url + "/" + connInfo.dbname;
  }
  axios
    .post(
      url,
      { gremlin: "g.V().count()" },
      {
        auth: {
          username: connInfo.username,
          password: connInfo.password,
        },
      }
    )
    .then((response) => {
      req.session.conn = connInfo;
      res.status(response.status).end();
    })
    .catch((error) => {
      if (typeof error.response === "object" && error.response.status === 401) {
        // 认证失败
        req.session.conn = undefined;
        res.status(401).end();
      } else {
        // 请求失败，检查地址端口或实例状态
        res.status(500).end();
      }
    });
});

module.exports = router;
