<template>
  <div>
    <b-container>
      <b-row>
        <b-col>
          <b-jumbotron>
            <template #header>Camunda Test Tool</template>
          </b-jumbotron>
        </b-col>
      </b-row>

    </b-container>
    <b-container fluid>
      <b-row class="justify-content-md-center">
        <b-col cols="7">
          <h4>Choose decision from
            <b-link :href="host"> {{ host }}</b-link>
          </h4>
          <hr/>
          <b-form-input v-model="q" placeholder="Search" @change="onsearch"></b-form-input>
          <div class="pt-3">
            <b-table :busy="isBusy" light small striped hover outlined :items="decisions" :fields="fields">
              <template #cell(key_name)="{item}">
                <div style="max-width: 200px">
                  {{ item.name }}
                  <b-badge variant="light"> {{ item.key }}</b-badge>
                </div>
              </template>
              <template #cell(resource)="{item}">
                {{ item.resource }}
                <b-badge variant="light"> v{{ item.version }}</b-badge>
              </template>
              <!-- A virtual column -->
              <template #cell(deployment)="data">
                <b-button-group class="float-right">
                  <b-button variant="outline-info" @click="rowclicked(data)">Open</b-button>
                  <b-button variant="outline-danger" @click="deploymentDelete(data)">Delete</b-button>
                </b-button-group>
              </template>
            </b-table>
          </div>
        </b-col>
        <b-col cols="2">
          <h4>Or upload</h4>
          <hr/>
          <b-form-file
              v-model="file"
              @change="publishFile"
              :state="file && (file.name.indexOf('.dmn')!==-1)"
              placeholder="Choose dmn or drop here"
              drop-placeholder="Drop file here"
          ></b-form-file>
          <div class="mt-3" v-show="file && (file.name.indexOf('.dmn')!==-1)">
            <b-button @click="publishFile" variant="outline-primary">
              <b-icon-cloud-upload></b-icon-cloud-upload>
              Publish
            </b-button>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <div v-if="deploymentToDelete">
      <b-modal ref="deleteModal" hide-footer title="Deployment Deleting">
        <div class="d-block text-center">
          <h3>You are trying to delete
            <b-badge> {{ deploymentToDelete.resource }}</b-badge>
          </h3>
          <p>{{ deploymentToDelete.deploymentId }}</p>
        </div>
        <b>Also this decisions will be removed:</b>
        <div>
          <ul>
            <li v-for="d in decisions.filter(c=>c.deploymentId ===deploymentToDelete.deploymentId)">
              {{ d.name }} - v{{ d.version }} {{ d.tenantId ? `(tenant ${d.tenantId})` : '' }}
            </li>
          </ul>
        </div>
        <hr/>
        <b-button-group class="float-right">
          <b-button variant="outline-primary" @click="hideDeleteModal">Cancel</b-button>
          <b-button variant="danger" @click="deploymentDeleteApproved">Delete</b-button>
        </b-button-group>
      </b-modal>
    </div>
  </div>
</template>

<script>
import axios from 'axios';


export default {
  name: "Camunda",
  data() {
    return {
      deploymentToDelete: undefined,
      file: undefined,
      isBusy: false,
      host: '',
      q: '',
      decisions: [],
      fields: [
        'key_name',
        {
          key: 'resource',
          sortable: true
        },
        {
          key: 'tenantId',
          sortable: true,
          sortDirection: 'desc'
        },
        'deployment'
      ]
    }
  },
  mounted() {
    const host = this.$store.getters['host']

    const url = `${host}/camunda/host`
    axios.get(url).then(({data}) => {
      this.host = data
    })
    this.onsearch()
  },
  methods: {
    publishFile() {
      if (this.file) {
        this.file.text().then(xml => {
          const tenantId = this.$store.getters["tenantId"]
          const payload = {
            xml,
            tenantId,
            fileName: this.file.name,
            deploymentName: this.file.name,
          }
          const host = this.$store.getters["host"]
          const publishUrl = `${host}/camunda/publish`;
          axios.post(publishUrl, payload).then(({data}) => {
            const {type} = data
            if (type) {
              const {message} = data
              this.$bvToast.toast(`${message}`, {
                title: 'Dmn error',
                variant: 'danger',
                autoHideDelay: 5000,
                appendToast: true
              })
              return
            }
            this.$bvToast.toast(`${this.file.name}`, {
              title: 'Dmn published',
              variant: 'success',
              autoHideDelay: 5000,
              appendToast: true
            })
            const {deployedDecisionDefinitions} = data
            if (deployedDecisionDefinitions)
              for (let i of Object.keys(deployedDecisionDefinitions)) {
                const definition = {...deployedDecisionDefinitions[i]}
                this.$router.push({name: 'Dmn', params: {id: definition.id}})
                break
              }
          })
        })
      }
    },
    showDeleteModal() {
      this.$refs.deleteModal.show()
    },
    hideDeleteModal() {
      this.$refs.deleteModal.hide()
    },
    onsearch() {
      this.isBusy = true
      const host = this.$store.getters['host']
      const url = `${host}/camunda?keyLike=%${this.q}%`
      axios.get(url).then(({data}) => {
        this.decisions = data
        this.isBusy = false
      })
    },
    rowclicked({item}) {
      this.$router.push({name: 'Dmn', params: {id: item.id}})
    },
    deploymentDelete({item}) {
      this.deploymentToDelete = item
      this.$nextTick(() => {
        this.showDeleteModal()
      })
    },
    deploymentDeleteApproved() {
      this.hideDeleteModal()
      const host = this.$store.getters['host']
      const url = `${host}/camunda/delete?id=${this.deploymentToDelete.deploymentId}`
      axios.delete(url).then(value => {
        this.$nextTick(() => {
          this.onsearch()
        })
      })
    }
  }
}
</script>

<style scoped>

</style>
