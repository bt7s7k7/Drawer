/// <reference path="./.vscode/config.d.ts" />

const { project, github } = require("ucpem")

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