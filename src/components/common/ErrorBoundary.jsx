import { Component } from "react";

import ServerErrorPage from "../../pages/errores/ServerErrorPage";

export default class ErrorBoundary extends Component {
  state = { huboError: false };

  static getDerivedStateFromError() {
    return { huboError: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.huboError) {
      return <ServerErrorPage />;
    }

    return this.props.children;
  }
}
