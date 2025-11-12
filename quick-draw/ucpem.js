/// <reference path="./.vscode/config.d.ts" />
const { project, github, copy, run } = require("ucpem")
const { writeFile, readFile, readdir, rm } = require("node:fs/promises")

project.isChild()

project.prefix("src").use(
    project.ref("drawer"),
    github("bt7s7k7/Vue3GUI").res("vue3gui"),
    github("bt7s7k7/Apsides").res("editor"),
)

project.prefix("src").res("threadServer",
    github("bt7s7k7/CommonTypes").res("comTypes"),
    github("bt7s7k7/Vue3GUI").res("vue3gui"),
)

project.script("build", async () => {
    const { build } = require("esbuild")

    await rm("./dist", { force: true, recursive: true })

    /** @type {string[]} */
    const index = []

    for await (const entry of await readdir("./src/drawer")) {
        index.push(`export * from "./drawer/${entry}"`)
    }

    await writeFile("./src/index.ts", index.join("\n") + "\n")

    await build({
        bundle: true,
        format: "esm",
        entryPoints: ["./src/index.ts"],
        outfile: "./dist/index.mjs",
        sourcemap: "external",
        logLevel: "info",
        platform: "browser",
    })

    await run("yarn tsc -p ./tsconfig.npm.json")

    const project = JSON.parse(await readFile("package.json", "utf-8"))
    delete project["devDependencies"]
    delete project["scripts"]
    delete project["dependencies"]
    await writeFile("./dist/package.json", JSON.stringify(project, null, 4))

    for (const file of [
        "README.md",
        "LICENSE",
    ]) {
        await copy(file, "./dist/" + file)
    }

}, { argc: 0, desc: "Builds the project" })
