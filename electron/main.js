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

const { app, BrowserWindow, shell } = require("electron");
const { ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const axios = require("axios");
const CypherClient = require("./drivers/cypher-client");
const GremlinClient = require("./drivers/gremlin-client");

const debug = /--debug/.test(process.argv[2]);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.removeMenu();
  const startUrl = url.format({
    pathname: path.join(__dirname, "build/index.html"),
    protocol: "file:",
    slashes: true,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(startUrl);

  // Open the DevTools.
  if (debug) {
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// ipc handlers
ipcMain.handle("query-old", async (_, dsl) => {
  if (global.connInfo === undefined) {
    return {
      success: false,
      data: { status: 401, msg: "not connected" },
    };
  }

  let result = await axios
    .post(
      `http://${global.connInfo.host}:${global.connInfo.port}/gremlin`,
      { gremlin: dsl },
      {
        auth: {
          username: global.connInfo.username,
          password: global.connInfo.password,
        },
      }
    )
    .then((response) => {
      return { success: true, data: response.data.result };
    })
    .catch((error) => {
      let result = { status: 500, msg: "" + error };
      if (typeof error.response != "object") {
        // no response
        return { success: false, data: result };
      }
      if ("status" in error.response) {
        result.status = error.response.status;
      }
      if (typeof error.response.data === "object" && typeof error.response.data.stackTrace === "string") {
        result.msg = error.response.data.stackTrace;
      }
      return { success: false, data: result };
    });
  return result;
});

ipcMain.handle("query", async (_, dsl) => {
  if (global.connInfo === undefined) {
    return {
      success: false,
      data: { status: 401, msg: "not connected" },
    };
  }

  var client = null;
  if (dsl.startsWith("g.")) {
    client = new GremlinClient(
      `ws://${global.connInfo.host}:${global.connInfo.port}/gremlin`,
      global.connInfo.username,
      global.connInfo.password
    );
  } else {
    client = new CypherClient(
      `bolt://${global.connInfo.host}:${global.connInfo.port}`,
      global.connInfo.username,
      global.connInfo.password
    );
  }

  let result = await client
    .run(dsl)
    .then((data) => {
      return { success: true, data: data };
    })
    .catch((error) => {
      return { success: false, data: error };
    });

  return result;
});

ipcMain.handle("set-connection", async (_, connInfo) => {
  let result = await axios
    .post(
      `http://${connInfo.host}:${connInfo.port}/gremlin`,
      { gremlin: "g.V().count()" },
      {
        auth: {
          username: connInfo.username,
          password: connInfo.password,
        },
      }
    )
    .then((_) => {
      global.connInfo = connInfo;
      return { success: true };
    })
    .catch((error) => {
      let result = { success: false };

      if (typeof error.response === "object" && "status" in error.response) {
        // 认证失败
        result.data = { status: error.response.status, msg: "" };
      } else {
        // 请求失败，检查地址端口和实例状态
        result.data = { status: -1, msg: "请求实例失败" };
      }

      return result;
    });

  return result;
});

app.on("web-contents-created", (e, webContents) => {
  webContents.on("new-window", (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});
