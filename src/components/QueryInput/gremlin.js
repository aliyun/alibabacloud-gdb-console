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

const gremlinKeywords = [
  "addAll",
  "addE",
  "addV",
  "aggregate",
  "all",
  "and",
  "any",
  "as",
  "asc",
  "assign",
  "barrier",
  "between",
  "both",
  "BOTH",
  "bothE",
  "bothV",
  "branch",
  "by",
  "cap",
  "choose",
  "coalesce",
  "coin",
  "constant",
  "containing",
  "count",
  "cyclicPath",
  "decr",
  "dedup",
  "desc",
  "div",
  "drop",
  "E",
  "emit",
  "endingWith",
  "eq",
  "explain",
  "filter",
  "first",
  "flatMap",
  "fold",
  "from",
  "get",
  "global",
  "group",
  "groupCount",
  "gt",
  "gte",
  "has",
  "hasId",
  "hasKey",
  "hasLabel",
  "hasNot",
  "hasValue",
  "id",
  "identity",
  "ids",
  "in",
  "IN",
  "incr",
  "index",
  "indexer",
  "inE",
  "inject",
  "inside",
  "inV",
  "is",
  "iterate",
  "key",
  "keys",
  "label",
  "labels",
  "last",
  "limit",
  "list",
  "local",
  "loops",
  "lt",
  "lte",
  "map",
  "match",
  "math",
  "max",
  "mean",
  "min",
  "minus",
  "mixed",
  "mult",
  "neq",
  "none",
  "normSack",
  "not",
  "notContaining",
  "notEndingWith",
  "notStartingWith",
  "option",
  "optional",
  "or",
  "order",
  "other",
  "otherV",
  "out",
  "OUT",
  "outE",
  "outside",
  "outV",
  "path",
  "profile",
  "project",
  "properties",
  "property",
  "propertyMap",
  "range",
  "repeat",
  "sack",
  "sample",
  "select",
  "shuffle",
  "sideEffect",
  "simplePath",
  "single",
  "skip",
  "startingWith",
  "store",
  "sum",
  "sumLong",
  "tail",
  "timeLimit",
  "times",
  "to",
  "toE",
  "tokens",
  "toString",
  "toV",
  "traversal",
  "tree",
  "tx",
  "unfold",
  "union",
  "until",
  "V",
  "value",
  "valueMap",
  "values",
  "where",
  "with",
  "within",
  "without",
  "withSack",
  "withSideEffect",
];

const autocompleteKeywords = [
  "addAll",
  "addE",
  "addV",
  "aggregate",
  "all",
  "and",
  "any",
  "as",
  "asc",
  "assign",
  "barrier",
  "between",
  "both",
  "BOTH",
  "bothE",
  "bothV",
  "branch",
  "by",
  "cap",
  "choose",
  "coalesce",
  "coin",
  "constant",
  "containing",
  "count()",
  "cyclicPath",
  "decr",
  "dedup",
  "desc",
  "div",
  "drop",
  "E",
  "emit",
  "endingWith",
  "eq",
  "explain",
  "filter",
  "first",
  "flatMap",
  "fold",
  "from",
  "get",
  "global",
  "group",
  "groupCount",
  "gt",
  "gte",
  "has",
  "hasId",
  "hasKey",
  "hasLabel",
  "hasNot",
  "hasValue",
  "id",
  "identity",
  "ids",
  "in()",
  "IN",
  "incr",
  "index",
  "indexer",
  "inE()",
  "inject",
  "inside",
  "inV()",
  "is",
  "iterate",
  "key",
  "keys",
  "label",
  "labels",
  "last",
  "limit",
  "list",
  "local",
  "loops",
  "lt",
  "lte",
  "map",
  "match",
  "math",
  "max",
  "mean",
  "min",
  "minus",
  "mixed",
  "mult",
  "neq",
  "none",
  "normSack",
  "not",
  "notContaining",
  "notEndingWith",
  "notStartingWith",
  "option",
  "optional",
  "or()",
  "order",
  "other()",
  "otherV()",
  "out()",
  "OUT",
  "outE()",
  "outside",
  "outV()",
  "path",
  "profile",
  "project",
  "properties",
  "property",
  "propertyMap",
  "range",
  "repeat",
  "sack",
  "sample",
  "select",
  "shuffle",
  "sideEffect",
  "simplePath",
  "single",
  "skip",
  "startingWith",
  "store",
  "sum",
  "sumLong",
  "tail",
  "timeLimit",
  "times",
  "to",
  "toE",
  "tokens",
  "toString",
  "toV",
  "traversal",
  "tree",
  "tx",
  "unfold",
  "union",
  "until",
  "value",
  "valueMap",
  "values",
  "where",
  "with",
  "within",
  "without",
  "withSack",
  "withSideEffect",
  ".addAll",
  ".addE",
  ".addV",
  ".aggregate",
  ".all",
  ".and",
  ".any",
  ".as",
  ".asc",
  ".assign",
  ".barrier",
  ".between",
  ".both()",
  ".BOTH",
  ".bothE()",
  ".bothV()",
  ".branch",
  ".by",
  ".cap",
  ".choose",
  ".coalesce",
  ".coin",
  ".constant",
  ".containing",
  ".count()",
  ".cyclicPath",
  ".decr",
  ".dedup",
  ".desc",
  ".div",
  ".drop",
  ".emit",
  ".endingWith",
  ".eq",
  ".explain",
  ".filter",
  ".first",
  ".flatMap",
  ".fold",
  ".from",
  ".get",
  ".global",
  ".group",
  ".groupCount()",
  ".gt",
  ".gte",
  ".has",
  ".hasId",
  ".hasKey",
  ".hasLabel",
  ".hasNot",
  ".hasValue",
  ".id()",
  ".identity",
  ".ids",
  ".in",
  ".IN",
  ".incr",
  ".index",
  ".indexer",
  ".inE",
  ".inject",
  ".inside",
  ".inV()",
  ".is",
  ".iterate",
  ".key",
  ".keys",
  ".label",
  ".labels",
  ".last",
  ".limit",
  ".list",
  ".local",
  ".loops",
  ".lt",
  ".lte",
  ".map",
  ".match",
  ".math",
  ".max()",
  ".mean",
  ".min()",
  ".minus",
  ".mixed",
  ".mult",
  ".neq",
  ".none",
  ".normSack",
  ".not",
  ".notContaining",
  ".notEndingWith",
  ".notStartingWith",
  ".option",
  ".optional",
  ".or()",
  ".order()",
  ".other()",
  ".otherV()",
  ".out()",
  ".OUT",
  ".outE()",
  ".outside",
  ".outV()",
  ".path()",
  ".profile",
  ".project",
  ".properties",
  ".property",
  ".propertyMap",
  ".range",
  ".repeat",
  ".sack",
  ".sample",
  ".select",
  ".shuffle",
  ".sideEffect",
  ".simplePath",
  ".single",
  ".skip",
  ".startingWith",
  ".store",
  ".sum()",
  ".sumLong",
  ".tail",
  ".timeLimit",
  ".times",
  ".to",
  ".toE()",
  ".tokens",
  ".toString",
  ".toV()",
  ".traversal",
  ".tree",
  ".tx",
  ".unfold",
  ".union",
  ".until",
  ".V",
  ".value",
  ".valueMap()",
  ".values()",
  ".where()",
  ".with",
  ".within",
  ".without",
  ".withSack",
  ".withSideEffect",
  "g.V()",
  "g.E()",
];

const GremlinSyntax = {
  token: (stream) => {
    if (stream.eatSpace()) {
      return null;
    }
    stream.eatWhile(/[$\w\u4e00-\u9fa5]/);
    const cur = stream.current();
    const exist = gremlinKeywords.some((item) => item === cur);
    if (exist) {
      return "keyword";
    }
    stream.next();
  },

  autocomplete: (token) => {
    return autocompleteKeywords.filter((item) => item.indexOf(token.string) === 0);
  },
};

export default GremlinSyntax;