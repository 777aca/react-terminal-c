import * as React from "react";
import * as Terminal from "./components/Terminal";
import * as ContextProvider from "./contexts";
import {
  TerminalContextProvider as _TerminalContextProvider,
  TerminalContext as _TerminalContext,
} from "./contexts/TerminalContext";

// 导出 Terminal 组件中定义的 clear 函数
export { clear } from "./components/Terminal";

export function ReactTerminal(props) {
  return (
    <ContextProvider.default>
      <Terminal.default {...props} />
    </ContextProvider.default>
  );
}

export const TerminalContextProvider = _TerminalContextProvider;
export const TerminalContext = _TerminalContext;

export default {
  ReactTerminal,
  TerminalContextProvider,
  TerminalContext,
  clear: Terminal.clear,
};
