import * as React from "react";

import { StyleContext } from "../contexts/StyleContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { TerminalContext } from "../contexts/TerminalContext";

import Utils from "../common/Utils";

// 导出一个名为useEditorInput的函数，用于处理编辑器输入
export const useEditorInput = (
  consoleFocused: boolean,
  editorInput: string,
  setEditorInput: any,
  setProcessCurrentLine: any,
  caretPosition: number,
  setCaretPosition: any,
  setBeforeCaretText: any,
  setAfterCaretText: any,
  enableInput: boolean,
  commands: any,
  multilineMode: boolean
) => {
  const { getPreviousCommand, getNextCommand } =
    React.useContext(TerminalContext);

  const handleKeyDownEvent = (event: any) => {
    if (!consoleFocused) {
      return;
    }
    if (!enableInput) {
      return;
    }
    event.preventDefault();

    const eventKey = event.key;

    if (multilineMode) {
      if (event.ctrlKey && eventKey === "Enter") {
        setProcessCurrentLine(true);
        return;
      }
      if (eventKey === "Enter") {
        setEditorInput(`${editorInput}\n`);
        setCaretPosition(caretPosition + 1);
        return;
      }
    }

    if (eventKey === "Enter") {
      setProcessCurrentLine(true);
      return;
    }

    let nextInput = null;

    if (eventKey === "Backspace") {
      const [caretTextBefore, caretTextAfter] = Utils.splitStringAtIndex(
        editorInput,
        caretPosition
      );
      nextInput = caretTextBefore.slice(0, -1) + caretTextAfter;
      if (editorInput && editorInput.length !== 0)
        setCaretPosition(caretPosition - 1);
    } else if (
      (multilineMode && event.ctrlKey && eventKey === "ArrowUp") ||
      (!multilineMode && eventKey === "ArrowUp")
    ) {
      nextInput = getPreviousCommand();
      if (nextInput) setCaretPosition(nextInput.length);
    } else if (
      (multilineMode && event.ctrlKey && eventKey === "ArrowDown") ||
      (!multilineMode && eventKey === "ArrowDown")
    ) {
      nextInput = getNextCommand();
      if (nextInput) setCaretPosition(nextInput.length);
      else setCaretPosition(0);
    } else if (eventKey === "ArrowLeft") {
      if (caretPosition > 0) setCaretPosition(caretPosition - 1);
      nextInput = editorInput;
    } else if (eventKey === "ArrowRight") {
      if (caretPosition < editorInput.length)
        setCaretPosition(caretPosition + 1);
      nextInput = editorInput;
    } else if (eventKey === "Tab") {
      const command = Object.keys(commands).find(
        (command: string) =>
          command.substring(0, editorInput.length) === editorInput
      );
      if (command) {
        setEditorInput(command);
        setCaretPosition(command.length);
        return;
      }
    } else if (
      ((event.metaKey || event.ctrlKey) && eventKey.toLowerCase() === "v") ||
      (event.shiftKey && event.key === "Insert")
    ) {
      navigator.clipboard.readText().then((pastedText) => {
        const [caretTextBefore, caretTextAfter] = Utils.splitStringAtIndex(
          editorInput || "",
          caretPosition
        );
        nextInput = caretTextBefore + pastedText + caretTextAfter;
        setCaretPosition(caretPosition + pastedText.length);
        setEditorInput(nextInput);
      });
    } else if (
      (event.metaKey || event.ctrlKey) &&
      eventKey.toLowerCase() === "c"
    ) {
      const selectedText = window.getSelection().toString();
      navigator.clipboard.writeText(selectedText).then(() => {
        nextInput = editorInput;
        setEditorInput(nextInput);
      });
    } else if (eventKey && eventKey.length === 1) {
      const [caretTextBefore, caretTextAfter] = Utils.splitStringAtIndex(
        editorInput,
        caretPosition
      );
      nextInput = caretTextBefore + eventKey + caretTextAfter;
      setCaretPosition(caretPosition + 1);
    } else if (eventKey === "Home") {
      // 光标移动至最前面
      setCaretPosition(0);
      nextInput = editorInput;
    } else if (eventKey === "End") {
      setCaretPosition(editorInput.length);
      nextInput = editorInput;
    } else nextInput = editorInput;

    setEditorInput(nextInput);
    setProcessCurrentLine(false);
  };

  React.useEffect(() => {
    // Bind the event listener
    document.addEventListener("keydown", handleKeyDownEvent);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("keydown", handleKeyDownEvent);
    };
  });

  React.useEffect(() => {
    const [caretTextBefore, caretTextAfter] = Utils.splitStringAtIndex(
      editorInput,
      caretPosition
    );
    setBeforeCaretText(caretTextBefore);
    setAfterCaretText(caretTextAfter);
  }, [editorInput, caretPosition]);
};

export const useBufferedContent = (
  processCurrentLine: any,
  setProcessCurrentLine: any,
  prompt: string,
  currentText: any,
  setCurrentText: any,
  setCaretPosition: any,
  setBeforeCaretText: any,
  setAfterCaretText: any,
  commands: any,
  errorMessage: any,
  defaultHandler: any
) => {
  const { setBufferedContent, setTemporaryContent } =
    React.useContext(TerminalContext);
  const style = React.useContext(StyleContext);
  const themeStyles = React.useContext(ThemeContext);

  React.useEffect(() => {
    if (!processCurrentLine) {
      return;
    }

    const processCommand = async (text: string) => {
      // const [command, ...rest] = text.trim().split(" ");
      const command = text;
      let output = "";

      if (command === "clear") {
        setBufferedContent("");
        setCurrentText("");
        setProcessCurrentLine(false);
        setCaretPosition(0);
        setBeforeCaretText("");
        setAfterCaretText("");
        return;
      }

      const waiting = (
        <>
          <span style={{ color: themeStyles.themePromptColor }}>{prompt}</span>
          <pre style={{ marginLeft: "8px", display: "inline-flex" }}>
            {currentText}
          </pre>
          <br />
        </>
      );
      setBufferedContent((previous: React.ReactNode) => (
        <>
          {previous}
          {waiting}
        </>
      ));
      setCurrentText("");
      setCaretPosition(0);
      setBeforeCaretText("");
      setAfterCaretText("");

      if (text) {
        if (command && commands[command]) {
          const executor = commands[command];

          if (typeof executor === "function") {
            output = await executor(command);
          } else {
            output = executor;
          }
        } else if (typeof defaultHandler === "function") {
          output = await defaultHandler(command);
        } else if (typeof errorMessage === "function") {
          output = await errorMessage(command);
        } else {
          output = errorMessage;
        }
      }
      const nextBufferedContent = (
        <div>
          {output ? (
            <pre>
              {output}
              <br />
            </pre>
          ) : null}
        </div>
      );

      setBufferedContent((previousBufferedContent: React.ReactNode) => (
        <>
          {previousBufferedContent}
          {nextBufferedContent}
        </>
      ));
      setTemporaryContent("");
      setProcessCurrentLine(false);
    };

    processCommand(currentText);
  }, [processCurrentLine]);

  const clear = () => {
    setBufferedContent("");
    setCurrentText("");
    setProcessCurrentLine(false);
    setCaretPosition(0);
    setBeforeCaretText("");
    setAfterCaretText("");
  };
  return { clear };
};

export const useCurrentLine = (
  caret: boolean,
  consoleFocused: boolean,
  prompt: string,
  commands: any,
  errorMessage: any,
  enableInput: boolean,
  defaultHandler: any,
  wrapperRef: any,
  multilineMode: boolean
) => {
  const style = React.useContext(StyleContext);
  const themeStyles = React.useContext(ThemeContext);
  const { appendCommandToHistory, temporaryContent } =
    React.useContext(TerminalContext);
  const mobileInputRef = React.useRef(null);
  const [editorInput, setEditorInput] = React.useState("");
  const [processCurrentLine, setProcessCurrentLine] = React.useState(false);
  const [caretPosition, setCaretPosition] = React.useState(0);
  const [beforeCaretText, setBeforeCaretText] = React.useState("");
  const [afterCaretText, setAfterCaretText] = React.useState("");

  React.useEffect(() => {
    if (!Utils.isMobile()) {
    }
  }, [consoleFocused]);

  React.useEffect(() => {
    if (!processCurrentLine) {
      return;
    }
    appendCommandToHistory(editorInput);
  }, [processCurrentLine]);

  React.useEffect(() => {
    if (wrapperRef.current !== null && mobileInputRef.current !== null) {
      wrapperRef.current.onclick = () => {
        mobileInputRef.current.focus();
      };
    }
  }, []);

  const mobileInput =
    Utils.isMobile() && enableInput ? (
      <div className={style.mobileInput}>
        <input
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          value={editorInput}
          onChange={(event) => setEditorInput(event.target.value)}
          ref={mobileInputRef}
          data-testid="editor-input"
        />
      </div>
    ) : null;

  const currentLine = !processCurrentLine ? (
    <>
      {mobileInput}
      <span style={{ color: themeStyles.themePromptColor }}>{prompt}</span>
      <div className={style.lineText}>
        <pre className={style.preWhiteSpace}>{beforeCaretText}</pre>
        {consoleFocused && caret ? (
          <span className={style.caret}>
            <span
              className={style.caretAfter}
              style={{ background: themeStyles.themeColor }}
            />
          </span>
        ) : null}
        <pre className={style.preWhiteSpace}>{afterCaretText}</pre>
      </div>
    </>
  ) : (
    <>
      {mobileInput}
      <div className={style.lineText}>
        {consoleFocused && caret ? (
          <span className={style.caret}>
            <span
              className={style.caretAfter}
              style={{ background: themeStyles.themeColor }}
            />
          </span>
        ) : null}
        <span className={style.preWhiteSpace}>{temporaryContent}</span>
      </div>
    </>
  );

  useEditorInput(
    consoleFocused,
    editorInput,
    setEditorInput,
    setProcessCurrentLine,
    caretPosition,
    setCaretPosition,
    setBeforeCaretText,
    setAfterCaretText,
    enableInput,
    commands,
    multilineMode
  );

  const { clear } = useBufferedContent(
    processCurrentLine,
    setProcessCurrentLine,
    prompt,
    editorInput,
    setEditorInput,
    setCaretPosition,
    setBeforeCaretText,
    setAfterCaretText,
    commands,
    errorMessage,
    defaultHandler
  );

  return { currentLine, clear };
};

export const useScrollToBottom = (changesToWatch: any, wrapperRef: any) => {
  React.useEffect(() => {
    if (!wrapperRef.current) return;
    // eslint-disable-next-line no-param-reassign
    wrapperRef.current.scrollTop = wrapperRef.current.scrollHeight;
  }, [changesToWatch]);
};
