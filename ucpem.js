/// <reference path="./.vscode/config.d.ts" />
// @ts-check

const { project, github, run, join, constants, copy } = require("ucpem")
const { build } = require("esbuild")
const { readFile, rename, rm } = require("fs/promises")

const drawer = project.prefix("src").res("drawer")

const drawerInput = project.prefix("src").res("drawerInput",
    drawer,
    github("bt7s7k7/EventLib").res("eventLib")
)

project.prefix("src").res("drawerInputVue",
    drawerInput
)

project.prefix("src").res("drawerInputVue3",
    drawerInput
)

project.script("build-drawer", async () => {
    const success = await build({
        bundle: true,
        format: "cjs",
        entryPoints: ["./src/index.ts"],
        outfile: "./target-drawer/lib/index.js",
        sourcemap: "external",
        logLevel: "info",
        platform: "node"
    }).then(() => true, () => false)

    if (success) await run("yarn tsc -p ./tsconfig.npm.json")
}, { desc: "Builds the drawer npm target" })

project.script("build-input", async () => {
    const success = await build({
        bundle: true,
        format: "cjs",
        entryPoints: ["./src/index-input.ts"],
        outfile: "./target-input/lib/index.js",
        sourcemap: "external",
        logLevel: "info",
        platform: "node",
        external: [
            "vue",
            "@bt7s7k7/drawer",
            "@bt7s7k7/eventlib",
        ],
        plugins: [
            {
                name: "Externalize directory",
                setup(build) {
                    build.onLoad({ filter: /./ }, async (args) => {
                        const contents = await readFile(args.path).then(v => v.toString()
                            .replace(/\.\.\/drawer\/[^"]+/g, "@bt7s7k7/drawer")
                            .replace(/\.\.\/eventLib\/[^"]+/g, "@bt7s7k7/eventlib")
                        )

                        return { contents, loader: "ts" }
                    })
                }
            }
        ]
    }).then(() => true, () => false)

    if (success) await run("yarn tsc -p ./tsconfig.input.json")

    const target = join(constants.projectPath, "./target-input/lib")

    await rm(join(target, "./drawer"), { recursive: true })
    await rm(join(target, "./eventLib"), { recursive: true })

    await copy(target, target, {
        quiet: true,
        replacements: [
            [/\.\.\/drawer\/[^"]+/g, "@bt7s7k7/drawer"],
            [/\.\.\/eventLib\/[^"]+/g, "@bt7s7k7/eventlib"]
        ]
    })

    await rename(join(target, "./index-input.d.ts"), join(target, "./index.d.ts"),)
}, { desc: "Builds the drawer-input npm target" })