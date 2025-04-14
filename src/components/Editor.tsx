import * as React from "react";

import { StyleContext } from "../contexts/StyleContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { TerminalContext } from "../contexts/TerminalContext";
import { useCurrentLine, useScrollToBottom } from "../hooks/editor";

const Editor = React.forwardRef((props: any, ref) => {
  const wrapperRef = React.useRef(null);
  const style = React.useContext(StyleContext);
  const themeStyles = React.useContext(ThemeContext);
  const { bufferedContent } = React.useContext(TerminalContext);

  useScrollToBottom(bufferedContent, wrapperRef);

  const {
    enableInput,
    caret,
    consoleFocused,
    prompt,
    commands,
    welcomeMessage,
    errorMessage,
    showControlBar,
    defaultHandler,
    multilineMode,
  } = props;

  const { currentLine, clear } = useCurrentLine(
    caret,
    consoleFocused,
    prompt,
    commands,
    errorMessage,
    enableInput,
    defaultHandler,
    wrapperRef,
    multilineMode
  );

  React.useImperativeHandle(ref, () => ({
    clear,
  }));

  return (
    <div
      id="terminalEditor"
      ref={wrapperRef}
      className={`${style.editor} ${!showControlBar ? style.curvedTop : null} ${
        showControlBar ? style.editorWithTopBar : null
      }`}
      style={{ background: themeStyles.themeBGColor }}
    >
      {welcomeMessage}
      {bufferedContent}
      {currentLine}
    </div>
  );
});

export default Editor;
