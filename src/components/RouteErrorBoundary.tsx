import {
  Component,
  useEffect,
  useRef,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { Link, useLocation } from "react-router";
import {
  FiAlertCircle,
  FiDownloadCloud,
  FiHome,
  FiRefreshCw,
} from "react-icons/fi";
import { useCopy } from "../i18n/useCopy";
import { sharedCopy } from "./copy";
import {
  isModuleLoadFailure,
  isModuleLoadFailureDuringUnload,
} from "./moduleLoadFailure";
import "./RouteErrorBoundary.scss";

const reloadApp = () => {
  window.location.reload();
};

interface RouteErrorScreenProps {
  isUpdateNeeded: boolean;
  onReset: () => void;
}

/** The friendly page shown in place of a route that failed to render. */
const RouteErrorScreen = ({
  isUpdateNeeded,
  onReset,
}: RouteErrorScreenProps) => {
  const copy = useCopy(sharedCopy).routeError;
  const { pathname } = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Screen reader and keyboard users land on the explanation instead of a lost focus.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="page route-error">
      <div className="route-error__mark" aria-hidden="true">
        {isUpdateNeeded ? (
          <FiDownloadCloud size={40} />
        ) : (
          <FiAlertCircle size={40} />
        )}
      </div>
      <h1 ref={headingRef} className="route-error__title" tabIndex={-1}>
        {isUpdateNeeded ? copy.updateTitle : copy.unexpectedTitle}
      </h1>
      <p className="route-error__body">
        {isUpdateNeeded ? copy.updateBody : copy.unexpectedBody}
      </p>
      <div className="route-error__actions">
        <button
          type="button"
          className="button button--primary"
          onClick={reloadApp}
        >
          <FiRefreshCw aria-hidden="true" size={18} />
          {copy.reload}
        </button>
        {!isUpdateNeeded && (
          <Link
            to="/"
            className="button button--secondary"
            viewTransition
            // Leaving for home resets the boundary through the pathname change;
            // on home itself the path stays the same, so reset it here.
            onClick={pathname === "/" ? onReset : undefined}
          >
            <FiHome aria-hidden="true" size={18} />
            {copy.backToHome}
          </Link>
        )}
      </div>
    </main>
  );
};

interface RouteErrorCatcherProps {
  resetKey: string;
  children: ReactNode;
}

interface RouteErrorCatcherState {
  error: unknown;
  hasError: boolean;
  /** True when a module load failure happened during unload, so nothing is shown or logged. */
  isIgnoredUnloadFailure: boolean;
  resetKey: string;
}

class RouteErrorCatcher extends Component<
  RouteErrorCatcherProps,
  RouteErrorCatcherState
> {
  state: RouteErrorCatcherState = {
    error: undefined,
    hasError: false,
    isIgnoredUnloadFailure: false,
    resetKey: this.props.resetKey,
  };

  static getDerivedStateFromError(
    error: unknown
  ): Partial<RouteErrorCatcherState> {
    return {
      error,
      hasError: true,
      isIgnoredUnloadFailure: isModuleLoadFailureDuringUnload(error),
    };
  }

  // A new pathname clears the error, so moving to another screen renders it normally.
  static getDerivedStateFromProps(
    props: RouteErrorCatcherProps,
    state: RouteErrorCatcherState
  ): Partial<RouteErrorCatcherState> | null {
    if (props.resetKey === state.resetKey) return null;
    return {
      error: undefined,
      hasError: false,
      isIgnoredUnloadFailure: false,
      resetKey: props.resetKey,
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    if (isModuleLoadFailureDuringUnload(error)) return;
    console.error("A route failed to render", error, errorInfo.componentStack);
  }

  private readonly reset = () => {
    this.setState({
      error: undefined,
      hasError: false,
      isIgnoredUnloadFailure: false,
    });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.state.isIgnoredUnloadFailure) return null;
    return (
      <RouteErrorScreen
        isUpdateNeeded={isModuleLoadFailure(this.state.error)}
        onReset={this.reset}
      />
    );
  }
}

/** Catches a route that throws while rendering, such as a lazy chunk a deploy removed. */
export const RouteErrorBoundary = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  return <RouteErrorCatcher resetKey={pathname}>{children}</RouteErrorCatcher>;
};

export default RouteErrorBoundary;
