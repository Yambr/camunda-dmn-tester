<template>
  <div>
    <div v-if="cases && cases.length">
      <h4 class="alert-light">Saved tests </h4>
      <b-list-group>
        <b-list-group-item class="flex-column align-items-start" v-for="c in cases" button
                           @click="loadCase(c)">
          <div class="d-flex w-100 justify-content-between">
            <span>{{ c.name }}</span>
            <span>
              <b-spinner v-show="c.state === states.executing" small variant="secondary" v-b-tooltip.hover
                         title="Executing..."></b-spinner>
              <b-icon-exclamation-triangle-fill v-show="c.state === states.warning"
                                                variant="warning" v-b-tooltip.hover
                                                title="Click and Evalute decision to see difference"></b-icon-exclamation-triangle-fill>
              <b-icon-x-octagon-fill v-show="c.state === states.error" variant="danger"
                                     :title="c.message"></b-icon-x-octagon-fill>
              <b-icon-check-circle v-show="c.state === states.success" variant="success" v-b-tooltip.hover
                                   title="Congrats! No difference!"></b-icon-check-circle>
            </span>
          </div>
        </b-list-group-item>
      </b-list-group>
      <b-button class="mt-2" variant="outline-success" @click="runTests" :disabled="runDisabled">
        <b-icon-collection-play></b-icon-collection-play>
        Run
      </b-button>
    </div>
    <b-jumbotron v-if="!(cases && cases.length)">
      <template #lead>
        <b-icon-droplet></b-icon-droplet>
        <span>  Evaluate and save new test case</span>
      </template>
    </b-jumbotron>
  </div>
</template>
<script>
import {compareResult, eventBus, getTestCaseByHash, listTestCases} from "../services/TestsStore";
import EngineAPI from "../services/EngineAPI";

export default {
  name: 'DmnTesterTests',
  props: {
    definition: {},
    decision: {},
    inputUpdate: {}
  },
  mounted() {
    const {decisionId} = this.decision
    this.updateCases()
    const callback = () => {
      this.updateCases()
    }
    eventBus.$on(`updateCase${decisionId}`, callback)
    eventBus.$on(`reloadCases`, callback)
  },
  data() {
    return {
      tenantId: this.$store.getters["tenantId"],
      cases: [],
      runDisabled: false,
      states: {
        executing: 1,
        warning: 2,
        error: 3,
        success: 4
      }
    }
  },
  methods: {
    runTests() {
      for (let t of this.cases) {
        t.state = this.states.executing
      }
      this.runDisabled = true
      this.evaluateTests().finally(() => {
        this.runDisabled = false
      })
    },
    async evaluateTests() {
      for (let t of this.cases) {
        await this.evaluateTest(t)
      }
    },
    async evaluateTest(item) {
      const {decisionId} = this.decision
      const {hash} = item
      const {input, output} = getTestCaseByHash(this.definition, decisionId, hash)
      const host = this.$store.getters["host"]
      const engine = new EngineAPI(host)
      const extractedVariables = input.data
      const isInvalid = engine.validateParams({decision: this.decision, extractedVariables})

      if (!isInvalid) {
        const variables = extractedVariables.map(({key, value, type}) => {
          return {
            name: key,
            value,
            type
          }
        })
        engine.evaluateDecision({
          tenantId: this.definition.tenantId,
          decision: this.decision,
          variables: variables
        }).then(result => {
          if (result.type) {
            item.state = this.states.error
            item.message = result.message
          } else {
            const {items, hasChanges} = compareResult(output.data, result)
            if (hasChanges) {
              item.state = this.states.warning
            } else {
              item.state = this.states.success
            }
          }
        }).catch(reason => {
          item.state = this.states.error
          item.message = reason
        });
      } else {
        item.state = this.states.error
        item.message = isInvalid.messages.join('\n')
      }

    },
    updateCases() {
      const {decisionId} = this.decision
      const cases = listTestCases(decisionId, this.definition)
      if (cases) {
        this.cases = cases.map(c => {
          return {...c, state: undefined, message: undefined}
        })
      } else
        this.cases = []
    },
    loadCase({hash, name}) {
      const {decisionId} = this.decision
      const {input} = getTestCaseByHash(this.definition, decisionId, hash)
      for (let variable of input.data) {
        this.inputUpdate(this.decision, variable)
      }
      this.$bvToast.toast(`Test Case fields loaded`, {
        title: `${name} loaded`,
        variant: 'success',
        autoHideDelay: 1500,
        appendToast: true
      })
    },
  }
}
</script>