import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

/** Keeps an ad/rendering failure from taking down the product experience. */
export class AdErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[ads] ad surface isolated after render failure", error, info.componentStack);
  }

  override render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}