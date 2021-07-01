<template>
  <b-container>
    <h2>DMN Tester
      <b-badge v-b-tooltip.hover
               title="tenant-id">{{ tenantId }}
      </b-badge>
    </h2>
    <b-row v-for="item in decisions">
      <b-col class="mb-3">
        <b-card>
          <b-row>
            <b-col cols="9">
              <b-row>
                <b-col>
                  <h4> {{ item.decision }}
                    <b-badge>{{ item.decisionId }}</b-badge>
                  </h4>
                  <div>
                    <b-input-group v-for="variable in item.variables">
                      <b-input-group-text v-if="!variable.custom" v-b-tooltip.hover
                                          :title="variable.expression"
                                          style="width: 30%">{{ variable.name }}
                      </b-input-group-text>
                      <b-form-input style="width: 10%" v-if="variable.custom" placeholder="name"
                                    v-model="variable.name">
                      </b-form-input>
                      <b-form-input placeholder="key" v-model="variable.key"
                                    :state="variable.key? undefined:variable.key!==''">
                      </b-form-input>

                      <div class="form-control" v-if="variable.type ==='boolean'">
                        <b-form-checkbox v-model="variable.value"
                                         :state="(variable.required? variable.value!==undefined: undefined)"
                                         @change="inputChange(item,variable)" debounce="500">
                          {{ variable.value }}
                        </b-form-checkbox>
                      </div>
                      <div>
                        <b-form-input @change="inputChange(item,variable)" debounce="500"
                                      :list="variable.inputValues && variable.inputValues.length?`${item.decisionId}_${variable.key}`:undefined"
                                      v-if="variable.type !=='boolean'" placeholder="value" v-model="variable.value"
                                      :type="typeMap[variable.type]"
                                      :state="(variable.required? variable.value!==undefined: undefined)">
                        </b-form-input>
                        <datalist v-if="variable.inputValues && variable.inputValues.length"
                                  :id="`${item.decisionId}_${variable.key}`">
                          <option v-for="i in variable.inputValues">{{ i }}</option>
                        </datalist>
                      </div>
                      <b-form-select text="Тип" v-model="variable.type" :options="types">
                      </b-form-select>
                    </b-input-group>
                    <b-button-toolbar>
                      <b-button-group class="mt-1">
                        <b-button variant="light" @click="add(item)"
                                  v-b-tooltip.hover title="Дополнительный входной параметр">
                          <b-icon-plus></b-icon-plus>
                          Добавить параметр
                        </b-button>
                      </b-button-group>
                    </b-button-toolbar>
                    <i v-show="item.downstreamDecisions.length">Has related decisions. Make sure related parameters are
                      specified</i>
                    <ul>
                      <li v-for="d in item.downstreamDecisions">
                        {{ d.name }}
                        <b-badge>{{ d.id }}</b-badge>
                      </li>
                    </ul>
                  </div>
                </b-col>
              </b-row>
              <b-row>
                <b-col>
                  <b-button-group class="float-right">
                    <b-button variant="light" @click="saveVariables(item)">
                      <b-icon-box-arrow-in-down></b-icon-box-arrow-in-down>
                      Save variables
                    </b-button>
                    <b-button variant="success" @click="evaluate(item)">
                      <b-icon-play></b-icon-play>
                      Evaluate decision
                    </b-button>
                  </b-button-group>
                </b-col>
              </b-row>
              <b-row v-if="item.testResult" class="mt-2">
                <b-col>
                  <b-alert v-model="!!item.testResult.type" variant="danger" dismissible>
                    <h6 class="alert-heading">{{ item.testResult.type }}</h6>
                    <hr>
                    <p class="mb-0" v-if="item.testResult.message"> {{ item.testResult.message }}</p>
                    <ol v-if="item.testResult.messages">
                      <li v-for="m in item.testResult.messages"> {{ m }}</li>
                    </ol>
                  </b-alert>
                </b-col>
              </b-row>
            </b-col>
            <b-col cols="3">
              <b-row>
                <b-col>
                  <DmnTesterTests :decision="item" :definition="definition" :inputUpdate="inputUpdate"/>
                </b-col>
              </b-row>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>
<script>
import {saveVariables} from "../services/TestsStore";
import DmnTesterTests from "./DmnTesterTests";

export default {
  name: 'DmnTester',
  components: {DmnTesterTests},
  props: {
    definition: {},
    decisions: {},
    evaluate: {}
  },
  data() {
    return {
      tenantId: this.$store.getters["tenantId"],
      typeMap: {
        'string': 'text',
        'integer': 'number',
        'long': 'number',
        'double': 'number',
        'date': 'date',
      },
      types: [
        {value: 'string', text: 'string'},
        {value: 'boolean', text: 'boolean'},
        {value: 'integer', text: 'integer'},
        {value: 'long', text: 'long'},
        {value: 'double', text: 'double'},
        {value: 'date', text: 'date'},
      ]
    }
  },
  methods: {
    saveVariables(item) {
      saveVariables(this.definition, this.decisions)
      this.$bvToast.toast(`Variables Saved Succefully`, {
        title: 'Variables Saved',
        variant: 'success',
        autoHideDelay: 5000,
        appendToast: true
      })
    },
    updateVariabe: function (overDecisions, variable) {
      for (let {variables} of overDecisions) {
        const samefields = variables.filter(c => c.key === variable.key && c.type === variable.type)
        for (let field of samefields) {
          field.value = variable.value
        }
      }
    },
    inputChange(item, variable) {
      const overDecisions = this.decisions.filter(c => c.decisionId !== item.decisionId)
      this.updateVariabe(overDecisions, variable);
    },
    inputUpdate(item, variable) {
      this.updateVariabe(this.decisions, variable);
    },
    add(item) {
      item.variables.push({type: 'string', custom: true})
    },
  }
}
</script>