/// <reference path="./.vscode/config.d.ts" />

const { project, github } = require("ucpem");

project.prefix("src").res("drawer")
project.prefix("src").res("drawerInput",
    github("bt7s7k7/EventLib").res("eventLib")
)