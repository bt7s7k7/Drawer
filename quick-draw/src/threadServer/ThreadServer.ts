import { findNthOccurrence, runString } from "../comTypes/util"

export abstract class ThreadServer {
    public code = ""

    protected _handleError(error: string) {
        postMessage({ kind: "error", error })
    }

    public pcall(thunk: () => void) {
        try {
            thunk()
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.error(err)
            const errText = err.stack as string
            const errRegexp = new RegExp(`code\\.js:(\\d+):(\\d+)`)
            const match = errText.match(errRegexp) ?? (err.message as string).match(errRegexp)
            let prefix = ""
            if (match) {
                const [line, column] = match.slice(1, 3).map(v => +v)
                const lineStart = line == 1 ? 0 : findNthOccurrence(this.code, "\n", line - 1)
                const lineEnd = this.code.indexOf("\n", lineStart + 1)
                const lineCode = this.code.slice(lineStart, lineEnd == -1 ? this.code.length : lineEnd)
                const indicator = " ".repeat(column - 1) + "^"
                prefix = lineCode + "\n" + indicator + "\n\n"
            }

            this._handleError(prefix + errText)
        }
    }

    protected _beforeCodeUpload() {

    }

    protected _postCodeUpload(result: any) {

    }

    protected _getFooter(): string {
        return ""
    }

    protected _makeEnvironment(): Record<string, any> {
        return {}
    }

    protected _handleMessage(message: any) {
        if (message.kind == "ping") {
            self.postMessage({ kind: "pong" })
            return
        }

        if (message.kind == "code") {
            this.code = "\n\n" + message.code
            this._beforeCodeUpload()

            this.pcall(() => {
                const result = runString({
                    source: message.code + this._getFooter(),
                    env: this._makeEnvironment(),
                    url: "virtual://thread/code.js",
                })

                if (!(typeof result == "object" && result != null)) return

                if (typeof result.init == "function") {
                    result.init()
                }

                this._postCodeUpload(result)
            })
            return
        }
    }

    public start() {
        self.addEventListener("message", async (event) => {
            const message = event.data
            this._handleMessage(message)
        })
    }
}
