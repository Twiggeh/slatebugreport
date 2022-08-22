import React, { ReactNode } from 'react';

class ErrorBoundary extends React.Component<{
	errorMsg?: string;
	children: ReactNode;
}> {
	state: { hasError: boolean; errorMsg: string };

	constructor(props: any) {
		super(props);
		this.state = { hasError: false, errorMsg: props.errorMsg };
	}

	static getDerivedStateFromError(error) {
		// Update state so the next render will show the fallback UI.
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		// You can also log the error to an error reporting service
		console.error('ERROR BOUNDARY HIT');
		console.error(error);
		console.error(errorInfo);
	}

	render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return <h1>Something went wrong. {this.state.errorMsg}</h1>;
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
