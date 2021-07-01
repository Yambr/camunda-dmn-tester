<template>
  <div>
    <b-tabs content-class="mt-3" fill pills card>
      <b-tab title="Inputs">
        <b-table responsive :items="input" small>
        </b-table>
      </b-tab>
      <b-tab title="Outputs" :active="(!testCase)">
        <b-table responsive :items="outputItems" :fields="outputFields" small>
          <template #head()="data">
            <span class="text-info">{{ data.label }} <b-badge>{{ data.column }}</b-badge> </span>
          </template>
          <template #cell()="{value}">
            <TestResultCell :value="value"/>
          </template>
        </b-table>
      </b-tab>
      <b-tab title="Difference" :disabled="(!testCase)" :active="(!!testCase)">
        <div v-if="testCase">
          <DifferenceTable :output="outputItems" :test-case="testCase"/>
        </div>
      </b-tab>
      <template #tabs-end>
        <li role="presentation" class="nav-item align-self-center">
          <b-input-group prepend="Name" class="pl-1">
            <b-form-input v-model="testCaseName"></b-form-input>
            <b-input-group-append>
              <b-button variant="outline-success"
                        @click="saveAsTestCase">
                {{ testCase ? 'Update TestCase' : 'Save as New TestCase' }}
              </b-button>
            </b-input-group-append>
          </b-input-group>
        </li>
      </template>
    </b-tabs>
  </div>
</template>
<script>
import TestResultCell from "./TestResultCell";
import {getTestCase, saveTestCase} from "../services/TestsStore";
import DifferenceTable from "./DifferenceTable";

export default {
  name: 'TestResultTable',
  components: {DifferenceTable, TestResultCell},
  props: {
    definition: {},
    test: {},
    input: {},
    output: {}
  },
  mounted() {
    this.outputItems = this.test.testResult
    this.outputFields = this.output.variables.map(c => {
      return {
        label: c.label,
        key: c.name
      }
    })
    const {decisionId} = this.test
    this.testCase = getTestCase(decisionId, this.definition, this.input)
    if (this.testCase)
      this.testCaseName = this.testCase.name
  },
  data() {
    return {
      testCase: undefined,
      testCaseName: 'TestCase1',
      outputItems: undefined,
      outputFields: undefined
    }
  },
  methods: {
    saveAsTestCase() {
      const {decisionId, testResult} = this.test
      saveTestCase(decisionId, this.testCaseName, this.definition, this.input, testResult)
    },
  }
}
</script>
