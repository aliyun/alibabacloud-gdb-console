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

/* eslint-disable max-len */
import React from "react";
import PropTypes from "prop-types";

import CodeMirror from "codemirror/lib/codemirror";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/display/placeholder";

import "codemirror/lib/codemirror.css";
import "codemirror/addon/hint/show-hint.css";

import "./index.css";

import GremlinSyntax from "./gremlin";
import CypherSyntax from "./cypher";

class QueryInput extends React.Component {
  static defaultProps = {
    placeholder: "",
    defaultValue: "",
    onEnter: null,
    isCypher: null,
  };

  constructor(props) {
    super(props);
    this.initGremlinForCodeMirror();
    this.editor_ = null;

    this.state = { isCypher: null };
  }

  componentDidMount() {
    if (this.editor_ == null) {
      const editor = CodeMirror.fromTextArea(this.textAreaRef_, {
        lineNumbers: false,
        lineWrapping: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        // noNewlines: true,
        autoFocus: true,
        mode: "gdb",
        extraKeys: {
          "Ctrl-Enter": () => {
            if (this.props.onEnter) {
              this.props.onEnter();
            }
          },
        },
      });
      editor.on("keyup", (cm, event) => {
        if (!cm.state.completionActive) {
          const key = String.fromCharCode(event.keyCode);
          if (/[a-z|.|¾]/i.test(key)) {
            editor.execCommand("autocomplete");
          }
        }
      });

      editor.on("change", (cm, event) => {
        const value = cm.getValue();
        if (this.state.isCypher == null && value.length >= 2) {
          if (value.startsWith("g.")) {
            this.setState({ isCypher: false });
          } else {
            this.setState({ isCypher: true });
          }
        } else {
          if (value.length === 0) {
            this.setState({ isCypher: null });
          }
        }
      });

      editor.setValue(this.props.defaultValue);
      this.editor_ = editor;
    }
  }

  setValue(value) {
    this.editor_.setValue(value);
  }

  getValue() {
    return this.editor_.getValue();
  }

  initGremlinForCodeMirror() {
    CodeMirror.defineMode("gdb", (config) => ({
      startState: () => {
        if (this.state.isCypher) {
          return CypherSyntax.startState();
        }
      },
      token: (stream, state) => {
        if (this.state.isCypher) {
          return CypherSyntax.token(stream, state);
        } else {
          return GremlinSyntax.token(stream);
        }
      },
      indent: (state, textAfter) => {
        if (this.state.isCypher) {
          return CypherSyntax.indent(state, textAfter, config.indentUnit);
        }
      },
    }));

    CodeMirror.registerHelper("hint", "gdb", (cm) => {
      const cur = cm.getCursor();
      const token = cm.getTokenAt(cur);
      let list;
      if (this.state.isCypher) {
        list = CypherSyntax.autocomplete(token);
      } else {
        list = GremlinSyntax.autocomplete(token);
      }
      const resultList = list.map((keyword) => ({
        text: keyword,
        displayText: keyword,
        render(el, _cm, data) {
          const icon = document.createElement("span");
          icon.innerText = "F";
          icon.className = "keyword-icon-CodeMirror-hint";
          const text = document.createElement("span");
          text.innerText = data.displayText;
          text.className = "keyword-CodeMirror-hint";
          el.appendChild(icon);
          el.appendChild(text);
        },
      }));
      if (resultList.length) {
        return {
          list: resultList,
          from: CodeMirror.Pos(cur.line, token.start),
          to: CodeMirror.Pos(cur.line, cur.ch),
        };
      }
    });

    // const beforeChange = (cm, event) => {
    //   // Identify typing events that add a newline to the buffer.
    //   const hasTypedNewline = (
    //     event.origin === '+input' &&
    //     typeof event.text === 'object' &&
    //     event.text.join('') === '')

    //   // Prevent newline characters from being added to the buffer.
    //   if (hasTypedNewline) {
    //     return event.cancel()
    //   }

    //   // Identify paste events.
    //   const hasPastedNewline = (
    //     event.origin === 'paste' &&
    //     typeof event.text === 'object' &&
    //     event.text.length > 1)

    //   // Format pasted text to replace newlines with spaces.
    //   if (hasPastedNewline) {
    //     const newText = event.text.join(' ')
    //     return event.update(null, null, [newText])
    //   }

    //   return null
    // }

    // CodeMirror.defineOption('noNewlines', false, (cm, val, old) => {
    //   // Handle attaching/detaching event listners as necessary.
    //   if (val === true && old !== true) {
    //     cm.on('beforeChange', beforeChange)
    //   } else if (val === false && old === true) {
    //     cm.off('beforeChange', beforeChange)
    //   }
    // })

    // CodeMirror.modeExtensions.gdb = {
    //   autoFormatLineBreaks: (text) => {
    //     const lines = text.split('\n');
    //     const reProcessedPortion = /\s+\b(return|where|order by|match|with|skip|limit|create|delete|set)\b\s/g;
    //     for (let i = 0; i < lines.length; i++) {
    //       lines[i] = lines[i].replace(reProcessedPortion, ' \n$1 ').trim();
    //     }
    //     return lines.join('\n');
    //   },
    // };
  }

  render() {
    return (
      <textarea
        ref={(textArea) => {
          this.textAreaRef_ = textArea;
        }}
        placeholder={this.props.placeholder}
      />
    );
  }
}

QueryInput.propTypes = {
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  onEnter: PropTypes.func,
};

export default QueryInput;
