import { Component, type ReactNode } from "react";

export default class VisualBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed
      ? this.props.fallback || null
      : this.props.children;
  }
}
