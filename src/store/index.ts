import Vue from "vue"
import Vuex from "vuex"

const cookie = require('cookie_js')

const TenantIdCoockieName = 'tenant-id-camunda-tester'
const AuthorNameCoockieName = 'author-name-camunda-tester'
const AuthorEmailCoockieName = 'author-email-camunda-tester'
const GitUserNameCoockieName = 'git-user-name-camunda-tester'

let TenantId = cookie.get(TenantIdCoockieName)
if (!TenantId) {
    TenantId = Math.random().toString(36).substring(7)
    cookie.set(TenantIdCoockieName, TenantId)
}

let AuthorName = cookie.get(AuthorNameCoockieName)
let AuthorEmail = cookie.get(AuthorEmailCoockieName)

let GitUserName = cookie.get(GitUserNameCoockieName)

Vue.use(Vuex)
export default new Vuex.Store({
    state: {
        host: process.env.VUE_APP_SERVER_HOST,
        definition: undefined,
        tenantId: TenantId,
        username: GitUserName,
        password: undefined,
        author: {
            name: AuthorName,
            email: AuthorEmail
        }
    },
    getters: {
        host: state => {
            return state.host
        },
        tenantId: state => {
            return state.tenantId
        },
        author: state => {
            if (state.author.name)
                return {...state.author}
            else
                return {
                    name: state.username,
                    email: undefined,
                }
        },
        credentialsGit: state => {
            if (state.username)
                return {
                    username: state.username,
                    password: state.password,
                }
            else return undefined
        }
    },
    mutations: {
        setCredentials(state, {username, password}) {
            state.username = username
            state.password = password
            state.tenantId = username
            cookie.set(GitUserNameCoockieName, username)
        },
        setAuthor(state, {name, email}) {
            state.author.name = name
            state.author.email = email
            cookie.set(AuthorNameCoockieName, name)
            cookie.set(AuthorEmailCoockieName, email)
        }
    },
    actions: {}
    ,
    modules: {}
})
