import * as React from "react";

import { StyleContext } from "../contexts/StyleContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { useClickOutsideEvent } from "../hooks/terminal";

import Controls from "./Controls";
import Editor from "./Editor";

import Utils from "../common/Utils";

interface TerminalProps {
  enableInput: boolean;
  caret: boolean;
  theme: string;
  showControlBar: boolean;
  multilineMode: boolean;
  showControlButtons: boolean;
  controlButtonLabels: string[];
  prompt: string;
  commands: Record<string, (...args: never) => void>;
  welcomeMessage: string | (() => void) | React.ReactNode;
  errorMessage: string | ((...args: never) => void) | React.ReactNode;
  defaultHandler: ((...args: never) => void) | null;
}

let clearTerminalFunction = null;

export function clear() {
  if (typeof clearTerminalFunction === "function") {
    clearTerminalFunction();
  }
}

function Terminal({
  enableInput = true,
  caret = true,
  theme = "light",
  showControlBar = true,
  multilineMode = false,
  showControlButtons = true,
  controlButtonLabels = ["close", "minimize", "maximize"],
  prompt = ">>>",
  commands = {},
  welcomeMessage = "",
  errorMessage = "not found!",
  defaultHandler = null,
}: TerminalProps) {
  const wrapperRef = React.useRef(null);
  const editorRef = React.useRef(null);
  const [consoleFocused, setConsoleFocused] = React.useState(!Utils.isMobile());
  const style = React.useContext(StyleContext);
  const themeStyles = React.useContext(ThemeContext);

  useClickOutsideEvent(wrapperRef, consoleFocused, setConsoleFocused);

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.clear) {
      clearTerminalFunction = editorRef.current.clear;
    }
  }, [editorRef.current]);

  const controls = showControlBar ? (
    <Controls
      consoleFocused={consoleFocused}
      showControlButtons={showControlButtons}
      controlButtonLabels={controlButtonLabels}
    />
  ) : null;

  const editor = (
    <Editor
      ref={editorRef}
      caret={caret}
      consoleFocused={consoleFocused}
      prompt={prompt}
      commands={commands}
      welcomeMessage={welcomeMessage}
      errorMessage={errorMessage}
      enableInput={enableInput}
      showControlBar={showControlBar}
      multilineMode={multilineMode}
      defaultHandler={defaultHandler}
    />
  );

  return (
    <div
      ref={wrapperRef}
      id={style.terminalContainer}
      className={style[`theme--${theme}`]}
      data-testid="terminal"
    >
      <div
        className={`${style.terminal}`}
        style={{
          background: themeStyles.themeToolbarColor,
          color: themeStyles.themeColor,
        }}
      >
        {controls}
        {editor}
      </div>
    </div>
  );
}

export default Terminal;
