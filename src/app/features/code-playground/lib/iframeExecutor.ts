import type { CodeFile, ConsoleMessage } from "./types";

// HTML template for the iframe sandbox
function createIframeHtml(
    jsCode: string,
    cssCode: string,
    htmlCode: string = ""
): string {
    // Transform JSX to JS using a simple runtime approach
    const transformedJs = transformJsxToJs(jsCode);

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 16px;
            min-height: 100vh;
            background: #fff;
        }
        #root { }
        ${cssCode}
    </style>
</head>
<body>
    ${htmlCode || '<div id="root"></div>'}
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script>
        // Console message interceptor
        const originalConsole = { ...console };
        const sendMessage = (type, content) => {
            window.parent.postMessage({
                type: 'console',
                payload: { type, content: String(content), timestamp: Date.now() }
            }, '*');
        };

        console.log = (...args) => {
            sendMessage('log', args.join(' '));
            originalConsole.log(...args);
        };
        console.error = (...args) => {
            sendMessage('error', args.join(' '));
            originalConsole.error(...args);
        };
        console.warn = (...args) => {
            sendMessage('warn', args.join(' '));
            originalConsole.warn(...args);
        };
        console.info = (...args) => {
            sendMessage('info', args.join(' '));
            originalConsole.info(...args);
        };

        // Error handler
        window.onerror = (message, source, lineno, colno, error) => {
            sendMessage('error', \`\${message} at line \${lineno}:\${colno}\`);
            return true;
        };

        window.onunhandledrejection = (event) => {
            sendMessage('error', 'Unhandled Promise rejection: ' + event.reason);
        };

        // Signal ready
        window.parent.postMessage({ type: 'ready' }, '*');
    </script>
    <script>
        try {
            ${transformedJs}
        } catch (err) {
            console.error('Execution Error: ' + err.message);
        }
    </script>
</body>
</html>`;
}

// Simple JSX transformer (converts JSX to React.createElement calls)
function transformJsxToJs(code: string): string {
    // This is a simplified transformer. For production, you'd use Babel.
    // We'll use a basic regex-based approach for common React patterns.

    let transformed = code;

    // Remove import/export statements and extract component definitions
    transformed = transformed
        .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, "")
        .replace(/export\s+default\s+/g, "const __ExportedComponent__ = ")
        .replace(/export\s+/g, "");

    // Transform arrow functions with JSX return
    // This is a simplified version - real implementation would use Babel
    transformed = transformJsxSyntax(transformed);

    // Auto-render if we have an exported component
    if (transformed.includes("__ExportedComponent__")) {
        transformed += `
;(function() {
    const root = document.getElementById('root');
    if (root && typeof __ExportedComponent__ !== 'undefined') {
        const rootElement = ReactDOM.createRoot(root);
        rootElement.render(React.createElement(__ExportedComponent__));
        console.log('Component rendered successfully');
    }
})();`;
    }

    return transformed;
}

// Transform JSX syntax to React.createElement
function transformJsxSyntax(code: string): string {
    // For complex JSX, we'll use a simplified approach
    // This handles basic JSX elements and fragments

    let result = code;

    // Transform self-closing tags: <Component /> -> React.createElement(Component)
    result = result.replace(
        /<([A-Z][a-zA-Z0-9.]*)\s*\/>/g,
        "React.createElement($1)"
    );

    // Transform self-closing tags with props
    result = result.replace(
        /<([A-Z][a-zA-Z0-9.]*)\s+([^>]*?)\/>/g,
        (match, tag, props) => {
            const propsObj = parseJsxProps(props);
            return `React.createElement(${tag}, ${propsObj})`;
        }
    );

    // Transform HTML elements self-closing
    result = result.replace(
        /<([a-z][a-z0-9]*)\s*\/>/g,
        'React.createElement("$1")'
    );

    // Transform fragments
    result = result.replace(/<>/g, "React.createElement(React.Fragment, null, ");
    result = result.replace(/<\/>/g, ")");

    // Handle more complex JSX - for full support, Babel would be used
    // For now, we handle simple cases and let more complex JSX be written
    // in a more verbose React.createElement style

    return result;
}

// Parse JSX props to an object string
function parseJsxProps(propsString: string): string {
    if (!propsString.trim()) return "null";

    const props: string[] = [];
    const propRegex = /(\w+)=\{([^}]+)\}|(\w+)="([^"]*)"|(\w+)/g;
    let match;

    while ((match = propRegex.exec(propsString)) !== null) {
        if (match[1] && match[2]) {
            // prop={value}
            props.push(`${match[1]}: ${match[2]}`);
        } else if (match[3] && match[4] !== undefined) {
            // prop="value"
            props.push(`${match[3]}: "${match[4]}"`);
        } else if (match[5]) {
            // boolean prop
            props.push(`${match[5]}: true`);
        }
    }

    return props.length > 0 ? `{ ${props.join(", ")} }` : "null";
}

export function generatePreviewHtml(files: CodeFile[]): string {
    // Find entry file (JSX/JS)
    const entryFile = files.find(f => f.isEntry) ||
        files.find(f => f.language === "jsx" || f.language === "tsx") ||
        files.find(f => f.language === "javascript" || f.language === "typescript");

    // Find CSS file
    const cssFile = files.find(f => f.language === "css");

    // Find HTML file
    const htmlFile = files.find(f => f.language === "html");

    const jsCode = entryFile?.content || "";
    const cssCode = cssFile?.content || "";
    const htmlCode = htmlFile?.content || "";

    return createIframeHtml(jsCode, cssCode, htmlCode);
}

export type { ConsoleMessage };
