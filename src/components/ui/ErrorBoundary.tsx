import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                    <h1 className="text-4xl font-bold text-red-500 mb-4">¡Ups! Algo salió mal.</h1>
                    <p className="text-gray-300 mb-4 text-center max-w-lg">
                        Ha ocurrido un error inesperado en la aplicación.
                        Por favor, intenta recargar la página.
                    </p>
                    <div className="bg-gray-800 p-4 rounded border border-gray-700 max-w-2xl w-full overflow-auto mb-6">
                        <p className="font-mono text-red-400 text-sm whitespace-pre-wrap">
                            {this.state.error?.toString()}
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded transition-colors"
                    >
                        Recargar Página
                    </button>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        className="mt-4 px-6 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 text-sm rounded transition-colors"
                    >
                        🚨 Borrar Datos y Reiniciar (Emergencia)
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                        (Usa el botón de emergencia si el error persiste al recargar)
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
