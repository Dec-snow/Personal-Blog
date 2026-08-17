import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
          <h2 className="text-2xl font-bold text-white/80">出错了</h2>
          <p className="mt-3 max-w-md text-sm text-white/50">
            页面渲染时发生了意外错误。请刷新页面重试。
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-6 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
