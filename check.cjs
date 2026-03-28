const ts = require('typescript');
const fs = require('fs');

function check() {
    const fileName = 'components/TeamRegistry.tsx';
    const program = ts.createProgram([fileName], {
        target: ts.ScriptTarget.Latest,
        jsx: ts.JsxEmit.React,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
    });
    const emitResult = program.emit();

    const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
            console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        }
    });
}
check();
