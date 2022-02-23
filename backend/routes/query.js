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
const CypherClient = require("../drivers/cypher-client");
const GremlinClient = require("../drivers/gremlin-client");

var router = express.Router();

router.post("/", function (req, res, next) {
  const connInfo = req.session.conn;
  if (connInfo === undefined) {
    res.status(401).end();
    return;
  }

  var client = null;
  if (req.body.type == "cypher") {
    client = new CypherClient(`bolt://${connInfo.host}:${connInfo.port}`, connInfo.username, connInfo.password);
  } else {
    client = new GremlinClient(`ws://${connInfo.host}:${connInfo.port}/gremlin`, connInfo.username, connInfo.password);
  }
  client
    .run(req.body.dsl)
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.status(500).json(error);
    })
    .finally(() => {
      client.close();
    });
});

module.exports = router;
