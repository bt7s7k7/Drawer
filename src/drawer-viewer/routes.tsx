import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import { Home } from './routes/Home'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/input',
        name: 'input',
        component: () => import(/* webpackChunkName: "input" */ './routes/Input')
    }
]

export const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})
