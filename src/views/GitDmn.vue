<template>
  <div>
    <b-button v-b-modal.modal-git v-b-tooltip.hover
              :variant="remote_origin_url?'outline-primary':'warning'"
              :title=" remote_origin_url ? 'Git publish remote' : 'Click for connect to git'" @click="checkGitInfo">
      <b-icon-github></b-icon-github>
      {{ remote_origin_url ? 'Git' : 'Git is not connected!' }}
    </b-button>
    <span></span>
    <b-modal id="modal-git" size="lg" :title="`Git for '${definition.resource}'`" ok-only>
      <div v-if="!remote_origin_url">
        <b-jumbotron>
          Git remote is not configured enter url and click 'Clone'
          <b-input-group prepend="Git Url" class="mt-3">
            <b-form-input
                :state="gitUrl && gitUrl.indexOf('.git')!==-1"
                v-model="gitUrl"
                placeholder="Enter git clone url"
                required
            ></b-form-input>
            <b-input-group-append>
              <b-button variant="success" @click="clone">
                Clone
              </b-button>
            </b-input-group-append>
          </b-input-group>
        </b-jumbotron>
      </div>
      <p>
        <b>{{ folder }}</b> is folder for this dmn <i> {{ remote_origin_url }} </i>
      </p>
      <div v-if="remote_origin_url">
        <p>
          <b>Current branch</b> is {{ currentBranch }}
        </p>
        <b-input-group prepend="Branch name" class="mt-3">
          <b-form-input
              v-model="branch"
              list="branches-list"
              placeholder="Select or enter the branch name, for example 'patch-1' "
              required
          ></b-form-input>
          <datalist id="branches-list">
            <option v-for="n in branches">{{ n }}</option>
          </datalist>
          <b-input-group-append>
            <b-button variant="outline-success" @click="checkout" v-b-tooltip.hover
                      title="This is change you current branch">
              <b-icon-bezier2></b-icon-bezier2>
              {{ branches.indexOf(branch) === -1 ? `Create from ${currentBranch}` : 'Checkout' }}
            </b-button>
          </b-input-group-append>
        </b-input-group>
        <div class="mt-2">
          <b-alert :show="!dmnPathExists" variant="warning">
            <h4 class="alert-heading">Dmn does not exist!</h4>
            <p>
              {{ definition.resource }} not found in {{ this.folder }}
            </p>
            <b>Save dmn to folder before commit</b>
          </b-alert>
          <b-alert :show="branch && (branch.indexOf('master')!==-1)" variant="danger">
            <h4 class="alert-heading">Master branch!</h4>
            <p>
              Using master branch is a bad idea for real projects. Create (Checkout) own branch or select another.
            </p>
          </b-alert>
          <b-row class="justify-content-md-center" v-show="dmnPathExists">
            <b-col md="auto">
              <b-button-group>
                <b-button variant="outline-secondary" @click="loadFromFolder" v-b-tooltip.hover
                          title="Loading from repository to modeler">
                  <b-icon-arrow-clockwise></b-icon-arrow-clockwise>
                  Load Dmn from folder
                </b-button>
              </b-button-group>
            </b-col>
          </b-row>
        </div>
        <hr/>
        <b-card no-body>
          <b-tabs card>
            <b-tab title="Commit" :active="activeTab===0">
              <b-form @submit="commit">
                <b-form-group
                    id="input-author-name-group"
                    label="Name:"
                    label-for="input-author-name"
                    description="author's name"
                >
                  <b-form-input
                      id="input-author-name"
                      v-model="author.name"
                      placeholder="Enter your name"
                      required
                  ></b-form-input>
                </b-form-group>
                <b-form-group
                    id="input-author-email-group"
                    label="Email address:"
                    label-for="input-author-email"
                    description="author's email address"
                >
                  <b-form-input
                      id="input-author-email"
                      v-model="author.email"
                      type="email"
                      placeholder="Enter your email"
                      required
                  ></b-form-input>
                </b-form-group>
                <b-form-group
                    id="input-commit-group"
                    label="Commit message:"
                    label-for="input-commit"
                >
                  <b-form-textarea
                      v-model="commitMessage"
                      placeholder="Add something incredible"
                      rows="3"
                      max-rows="6"
                      id="input-commit"
                      required
                  ></b-form-textarea>
                </b-form-group>
                <b-button type="submit" variant="success">
                  <b-icon-check2></b-icon-check2>
                  Commit
                </b-button>
              </b-form>
            </b-tab>
            <b-tab title="History" :active="activeTab===1">
              <b-button class="mb-2" variant="outline-success" @click="pullFromRemote" v-b-tooltip.hover
                        :title="`Pull new changes from ${currentBranch} to modeller`">
                <b-icon-arrow-down></b-icon-arrow-down>
                Pull Changes
              </b-button>
              <span class="alert-light">
              from '{{ currentBranch }}' remote branch
              </span>
              <b-table :items="commits" :fields="commitFields" small>
                <template #cell(author)="{item}">
                  {{ item.author.name }}
                  <small>{{ item.author.email }}</small>
                </template>
                <template #cell(time)="{item}">
                  {{ dateToString(item.author.timestamp * 1000) }}
                </template>
              </b-table>
              <b-button variant="success" @click="pushToRemote" v-b-tooltip.hover
                        :title="`Push to ${currentBranch} of ${remote_origin_url}`">
                <b-icon-arrow-up></b-icon-arrow-up>
                Push Changes
              </b-button>
              <span class="alert-light">
              to '{{ currentBranch }}' branch
            </span>
            </b-tab>
          </b-tabs>
        </b-card>
      </div>
    </b-modal>
  </div>
</template>
<script>
import {BFSRequire} from 'browserfs'

const fs = BFSRequire('fs');
const path = BFSRequire('path');

const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
import {rootFolderPath} from "../services/TestsStore";

import moment from "moment";

export default {
  name: 'GitDmn',
  props: {
    definition: {},
    readDiagram: {}
  },
  data() {
    return {
      dmnPathExists: false,
      activeTab: 0,
      author: this.$store.getters.author,
      commitMessage: undefined,
      branches: [],
      commits: [],
      commitFields: [
        'message',
        'author',
        'time'
      ],
      folder: undefined,
      gitUrl: undefined,
      info: undefined,
      remote_origin_url: undefined,
      currentBranch: undefined,
      branch: undefined
    }
  },
  async mounted() {
    this.folder = rootFolderPath(this.definition.resource)
    await this.checkGitInfo()
  },
  methods: {
    dateToString(date) {
      return moment(new Date(date)).calendar()
    },
    async checkout() {
      try {
        if (this.branches.indexOf(this.branch) === -1) {
          await git.branch({
            fs,
            dir: this.folder,
            ref: this.branch,
            checkout: true
          })
        } else {
          await git.checkout({
            fs,
            dir: this.folder,
            ref: this.branch
          })
        }
        await this.checkGitInfo()

      } catch (reason) {
        this.$bvToast.toast(`${reason}`, {
          title: 'Clone error',
          variant: 'danger',
          autoHideDelay: 5000,
          appendToast: true
        })
      }
    },
    loadFromFolder() {
      const file = path.join(this.folder, this.definition.resource)
      const data = fs.readFileSync(file, 'utf8')
      this.readDiagram(data)
      this.$bvToast.toast(`Dmn loaded from repository!`, {
        title: 'Loaded success',
        variant: 'success',
        autoHideDelay: 5000,
        appendToast: true
      })
    },
    async checkGitInfo() {
      try {
        this.remote_origin_url = await git.getConfig({
          fs,
          dir: this.folder,
          path: 'remote.origin.url'
        })
        this.branch = this.currentBranch = await git.currentBranch({
          fs,
          dir: this.folder,
          fullname: false
        })
        const branches = await git.listBranches({fs, dir: this.folder})
        const remoteBranches = await git.listBranches({fs, dir: this.folder, remote: 'origin'})
        this.branches = [...new Set([...branches, ...remoteBranches])]
        const commits = await git.log({
          fs,
          dir: this.folder,
          depth: 5,
          ref: this.branch
        })
        this.commits = commits.map(({commit}) => {
          return commit
        })

        this.dmnPathExists = fs.existsSync(path.join(this.folder, this.definition.resource))

      } catch {
      }
    },
    onAuth(url) {
      let auth = this.$store.getters["credentialsGit"]
      if (auth && auth.password) return auth

      if (confirm('This repo is password protected. Ready to enter a username & password?')) {
        auth = {
          username: prompt('Enter username', auth ? auth.username : ''),
          password: prompt('Enter password'),
        }
        this.$store.commit("setCredentials", auth)
        return auth
      } else {
        return {cancel: true}
      }
    },
    async clone() {
      const host = this.$store.getters["host"]
      try {
        this.info = await git.getRemoteInfo({
          http,
          url: this.gitUrl,
          corsProxy: host,
          onAuth: this.onAuth
        })
        await git.clone(
            {
              fs,
              http,
              dir: this.folder,
              url: this.gitUrl,
              corsProxy: host,
              onAuth: this.onAuth
            })
        await this.checkGitInfo()
      } catch (reason) {
        this.$bvToast.toast(`${reason}`, {
          title: 'Clone error',
          variant: 'danger',
          autoHideDelay: 5000,
          appendToast: true
        })
      }
    },
    async commit(event) {
      event.preventDefault()
      let sha = await git.commit({
        fs,
        dir: this.folder,
        author: this.author,
        message: this.commitMessage
      })
      this.$bvToast.toast(`Hash of commit ${sha}. Now you can Push Changes to Remote!`, {
        title: 'Commit success',
        variant: 'success',
        autoHideDelay: 5000,
        appendToast: true
      })
      await this.checkGitInfo()
      this.activeTab = 1
      this.$store.commit("setAuthor", this.author)
    },
    pullFromRemote() {
      git.pull({
        fs,
        http,
        dir: this.folder,
        remote: 'origin',
        ref: this.currentBranch,
        onAuth: this.onAuth,
        singleBranch: true,
        fastForwardOnly: true,
        author: {name: this.author.name ? this.author.name : 'dmn-tester-foo'}
      }).then(value => {
        this.$bvToast.toast(`Pull from ${this.remote_origin_url} finished`, {
          title: 'Pull success',
          variant: 'success',
          autoHideDelay: 5000,
          appendToast: true
        })
        this.loadFromFolder()
        this.checkGitInfo()
      }).catch(reason => {
        this.$bvToast.toast(`${reason}`, {
          title: 'Commit error',
          variant: 'danger',
          autoHideDelay: 5000,
          appendToast: true
        })
      })
    },
    pushToRemote() {

      git.push({
        fs,
        http,
        dir: this.folder,
        remote: 'origin',
        ref: this.currentBranch,
        onAuth: this.onAuth
      }).then(({ok, error}) => {
        if (ok)
          this.$bvToast.toast(`Publishing to remote success! now you can see results in your repository and create Merge request`, {
            title: 'Push success',
            variant: 'success',
            autoHideDelay: 5000,
            appendToast: true
          })
        else
          this.$bvToast.toast(error, {
            title: 'Commit error',
            variant: 'danger',
            autoHideDelay: 5000,
            appendToast: true
          })
      }).catch(reason => {
        this.$bvToast.toast(`${reason}`, {
          title: 'Commit error',
          variant: 'danger',
          autoHideDelay: 5000,
          appendToast: true
        })
      })
    }
  }
}
</script>