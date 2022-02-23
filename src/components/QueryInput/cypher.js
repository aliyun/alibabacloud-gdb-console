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

import CodeMirror from "codemirror/lib/codemirror";

const cypherKeywords = [
  // 'CYPHER',
  // 'EXPLAIN',
  // 'PROFILE',
  // 'USING',
  // 'PERIODIC',
  "COMMIT",
  "UNION",
  "ALL",
  "CREATE",
  "DROP",
  // 'INDEX',
  "ON",
  "CONSTRAINT",
  "ASSERT",
  "IS",
  "UNIQUE",
  "EXISTS",
  // 'LOAD',
  "CSV",
  "WITH",
  "HEADERS",
  "FROM",
  "AS",
  "FIELDTERMINATOR",
  "OPTIONAL",
  "MATCH",
  "UNWIND",
  "MERGE",
  "SET",
  "DETACH",
  "DELETE",
  "REMOVE",
  "FOREACH",
  "IN",
  "DISTINCT",
  "RETURN",
  "ORDER",
  "BY",
  "SKIP",
  "LIMIT",
  "ASCENDING",
  "ASC",
  "DESCENDING",
  "DESC",
  "JOIN",
  "SCAN",
  "STARTS",
  "START",
  "NODE",
  "RELATIONSHIP",
  "REL",
  "WHERE",
  "SHORTESTPATH",
  "ALLSHORTESTPATHS",
  "OR",
  "XOR",
  "AND",
  "NOT",
  "ENDS",
  "CONTAINS",
  "NULL",
  "COUNT",
  "FILTER",
  "EXTRACT",
  "ANY",
  "NONE",
  "SINGLE",
  "TRUE",
  "FALSE",
  "REDUCE",
  "CASE",
  "ELSE",
  "END",
  "WHEN",
  "THEN",
  "CALL",
  "YIELD",
  "KEY",
  "CATALOG",
  "SHOW",
  "DEFAULT",
  // 'DBMS',
  // 'DATABASES',
  // 'DATABASE',
  // 'GRAPHS',
  // 'GRAPH',
  "REPLACE",
  "IF",
  "STOP",
  // 'ROLES',
  // 'ROLE',
  // 'USERS',
  // 'USER',
  "POPULATED",
  "PASSWORD",
  "CHANGE",
  "REQUIRED",
  "STATUS",
  "ACTIVE",
  "SUSPENDED",
  "ALTER",
  "CURRENT",
  "TO",
  // 'PRIVILEGES',
  // 'GRANT',
  // 'DENY',
  // 'REVOKE',
  "RELATIONSHIPS",
  "NODES",
  "ELEMENTS",
  "ELEMENT",
  "COPY",
  "OF",
  "TRAVERSE",
  "READ",
  "WRITE",
  "ACCESS",
  "INDEXES",
  "MANAGEMENT",
  "NEW",
  "LABELS",
  "LABEL",
  "NAMES",
  "NAME",
  "TYPES",
  "TYPE",
  "PROPERTY",
  "CONSTRAINTS",
  "ASSIGN",
  // 'BTREE',
  "EXIST",
  "FOR",
  "OPTIONS",
  "EXECUTE",
  "DEFINED",
  // 'FUNCTION',
  // 'FUNCTIONS',
  // 'BOOSTED',
  // 'PROCEDURE',
  // 'PROCEDURES',
  // 'ADMIN',
  // 'ADMINISTRATOR',
  // 'BRIEF',
  // 'VERBOSE',
  // 'OUTPUT',
];

const operators = [
  ";",
  "(",
  ")",
  "{",
  "}",
  "[",
  "]",
  "$",
  ":",
  ".",
  "=",
  "<",
  ">",
  "+",
  "-",
  "*",
  "`",
  ",",
  "?",
  "|",
  "..",
  "+=",
  "<>",
  "!=",
  "<=",
  ">=",
  "/",
  "%",
  "^",
  "=~",
];

const keywordRegexes = cypherKeywords.map((w) => new RegExp(w, "i"));
const lineCommentRegex = /\/\/[^\r\n]*/;
const blockCommentRegex = /\/\*([\S\s]*?)\*\//;
const stringRegex = /('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/;
const stringStartRegex = /('([^'\\]|\\.)*|"([^"\\]|\\.)*)/; // match just opened and not closed string as string
const integerRegex = /[+-]?(([1-9][0-9]+)|([0-9]))/;
const decimalRegex = /[+-]?(([1-9][0-9]+)|([0-9]))\.[0-9]+/;

const tokenBase = (stream) => {
  if (stream.match(lineCommentRegex) || stream.match(blockCommentRegex)) {
    return "comment";
  } else if (stream.match(stringRegex)) {
    return "string";
  } else if (stream.match(integerRegex)) {
    return "number";
  } else if (stream.match(decimalRegex)) {
    return "number";
  } else if (operators.find((o) => stream.match(o))) {
    return "operator";
  } else if (keywordRegexes.find((k) => stream.match(k))) {
    return "keyword";
  } else if (stream.match(stringStartRegex)) {
    return "string";
  }

  stream.next();
  stream.eatWhile(/[_\w\d]/);

  return "variable";
};
const pushContext = (state, type, col) => {
  state.context = {
    prev: state.context,
    indent: state.indent,
    col,
    type,
  };
  return state.context;
};
const popContext = (state) => {
  state.indent = state.context.indent;
  state.context = state.context.prev;
  return state.context;
};

const CypherSyntax = {
  startState: () => {
    return {
      tokenize: tokenBase,
      context: null,
      indent: 0,
      col: 0,
    };
  },

  token: (stream, state) => {
    let curPunc;
    if (stream.sol()) {
      if (state.context && state.context.align == null) {
        state.context.align = false;
      }
      state.indent = stream.indentation();
    }
    if (stream.eatSpace()) {
      return null;
    }
    const style = state.tokenize(stream, state);
    if (style !== "comment" && state.context && state.context.align == null && state.context.type !== "pattern") {
      state.context.align = true;
    }
    if (curPunc === "(") {
      pushContext(state, ")", stream.column());
    } else if (curPunc === "[") {
      pushContext(state, "]", stream.column());
    } else if (curPunc === "{") {
      pushContext(state, "}", stream.column());
    } else if (/[\]})]/.test(curPunc)) {
      while (state.context && state.context.type === "pattern") {
        popContext(state);
      }
      if (state.context && curPunc === state.context.type) {
        popContext(state);
      }
    } else if (curPunc === "." && state.context && state.context.type === "pattern") {
      popContext(state);
    } else if (/atom|string|variable/.test(style) && state.context) {
      if (/[}\]]/.test(state.context.type)) {
        pushContext(state, "pattern", stream.column());
      } else if (state.context.type === "pattern" && !state.context.align) {
        state.context.align = true;
        state.context.col = stream.column();
      }
    }
    return style;
  },

  autocomplete: (token) => {
    return cypherKeywords.filter((item) => item.indexOf(token.string.toUpperCase()) === 0);
  },

  indent: (state, textAfter, indentUnit) => {
    const firstChar = textAfter && textAfter.charAt(0);
    let context = state.context;
    if (/[\]}]/.test(firstChar)) {
      while (context && context.type === "pattern") {
        context = context.prev;
      }
    }
    const closing = context && firstChar === context.type;
    if (!context) return 0;
    if (context.type === "keywords") return CodeMirror.commands.newlineAndIndent;
    if (context.align) return context.col + (closing ? 0 : 1);
    return context.indent + (closing ? 0 : indentUnit);
  },
};

export default CypherSyntax;
