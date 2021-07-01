import Vue from "vue"
import VueRouter, {RouteConfig} from "vue-router"
import Home from "../views/Home.vue"

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
    {
        path: "/",
        name: "Home",
        component: Home
    },
    {
        path: "/files",
        name: "Files",
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ "../views/Files.vue")
    },
    {
        path: "/dmn",
        name: "DmnNew",
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ "../views/Dmn.vue")
    },
    {
        path: "/dmn/:id",
        name: "Dmn",
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ "../views/Dmn.vue"),
        props: true
    }
]

const router = new VueRouter({
    mode: "history",
    base: process.env.BASE_URL,
    routes
})

export default router
