// src/main.jsx
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { MyContextProvider } from './MyContext';
import './index.css';

const LoadingFallback = () => <div>Loading application...</div>;

class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div>
                    <h1>Something went wrong</h1>
                    <p>{this.state.error?.message || 'Unknown error'}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

const isProduction = process.env.NODE_ENV === 'production';

ReactDOM.createRoot(document.getElementById('root')).render(
    isProduction ? (
        <BrowserRouter>
            <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                    <MyContextProvider>
                        <App />
                    </MyContextProvider>
                </Suspense>
            </ErrorBoundary>
        </BrowserRouter>
    ) : (
        <React.StrictMode>
            <BrowserRouter>
                <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                        <MyContextProvider>
                            <App />
                        </MyContextProvider>
                    </Suspense>
                </ErrorBoundary>
            </BrowserRouter>
        </React.StrictMode>
    )
);