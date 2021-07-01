<template>
  <div>
    <b-container>
      <h1>DMN Modeler
        <b-badge v-if="definition">{{ definition.resource }} v{{ definition.version }}</b-badge>
      </h1>
    </b-container>
    <b-container fluid>
      <b-row>
        <b-col>
          <div class="test-container">
            <div class="editor-parent">
              <div ref="editor" class="editor-container"></div>
              <div class="editor-tabs">
                <div v-for="v in views" class="tab" v-bind:class="{active:v === activeView}"
                     @click="tabClick(v)">
                  <span :class="CLASS_NAMES[v.type]"></span>
                  {{ v.element.name || v.element.id }}
                </div>
              </div>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-container class="mt-1">
      <b-row>
        <b-col md="4">
          <GitDmn :definition="definition" v-if="definition.resource" :readDiagram="readDiagram"/>
        </b-col>
        <b-col md="6" offset-md="2">
          <b-input-group>
            <b-input-group-prepend>
              <b-button @click="downloadXml" variant="outline-info">
                <b-icon-download></b-icon-download>
                Download current
              </b-button>
            </b-input-group-prepend>
            <b-form-input v-model="definition.resource"
                          :state="definition.resource.indexOf('.dmn')!==-1"
                          placeholder="example.dmn"></b-form-input>
            <b-input-group-append>
              <b-button @click="publishXml" variant="outline-success">
                <b-icon-cloud-upload></b-icon-cloud-upload>
                Publish as version
                {{ (definition ? definition.version : 0) + 1 }}
              </b-button>
            </b-input-group-append>
          </b-input-group>
        </b-col>
      </b-row>
    </b-container>
    <hr/>
    <DmnTester :definition="definition" :decisions="decisions" :evaluate="evaluate"/>
    <b-modal ref="testResultsModal" size="xl" :title="`Test result '${currentTest?currentTest.decision:''}'`">
      <div v-if="currentTest">
        <TestResultTable :definition="definition" :test="currentTest" :input="currentTestInputFields"
                         :output="currentTestOutputFields"/>
      </div>
      <template #modal-footer>
        <div class="w-100">
          <b-button-group class="float-right">
            <b-button
                variant="primary"
                @click="closeModal">
              Close
            </b-button>
          </b-button-group>
        </div>
      </template>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'
import EngineAPI from "../services/EngineAPI";
import {reloadCases, rootFolderPath, updateVariables, writeFile} from "../services/TestsStore";
import {extractDependencyVariables, getInputVariables, getOutputVariables} from "../services/InputVariableHelper";
import {migrateDiagram} from '@bpmn-io/dmn-migrate';
import TestResultTable from "../components/TestResultTable";
import {registerDmnHighlihgt} from "../services/results-highlighting/dmn-viewer-extension";
import DmnTester from "./DmnTester";
import GitDmn from "./GitDmn";
import {BFSRequire} from "browserfs";

const fs = BFSRequire('fs');
const path = BFSRequire('path');

export default {
  name: "Dmn",
  components: {GitDmn, DmnTester, TestResultTable},
  props: ['id'],
  data() {
    return {
      tenantId: undefined,
      xmlHash: undefined,
      definition: {
        resource: '',
        version: 0
      },
      CLASS_NAMES: {
        drd: 'dmn-icon-lasso-tool',
        decisionTable: 'dmn-icon-decision-table',
        literalExpression: 'dmn-icon-literal-expression'
      },
      modeler: undefined,
      highlight: {},
      decisions: [],
      activeView: undefined,
      views: [],
      currentTest: undefined,
      currentTestInputFields: undefined,
      currentTestOutputFields: undefined,
      currentTestResults: undefined
    }
  },
  async mounted() {

    const $container = this.$refs.editor;
    // modeler instance
    const dmnModeler = new DmnJS({
      container: $container,
      height: 750,
      width: '100%',
      keyboard: {
        bindTo: window
      }
    });
    this.modeler = dmnModeler

    dmnModeler.on('views.changed', function (event) {
      let {views, activeView} = event;
      this.activeView = activeView
      this.views = views
      setTimeout(function () {
        if (this.currentTestResults)
          this.highlightResults()
      }.bind(this), 500)
    }.bind(this));
    const host = this.$store.getters["host"]
    let definition = undefined
    if (this.id) {

      const definitionUrl = `${host}/camunda/definition?id=${this.id}`;
      const {data} = await axios.get(definitionUrl)
      definition = data
    }

    if (definition) {
      const {id, tenantId} = definition
      this.tenantId = tenantId
      const diagramUrl = `${host}/camunda/xml?id=${id}`;
      axios.get(diagramUrl).then(({data}) => {
        const {dmnXml} = data
        this.readDiagram(dmnXml)
      })
      this.definition = definition
    } else {
      const empty = '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/" name="definitions" id="Definitions_' + Math.random().toString(36).substring(5)
          + '" name="DRD" namespace="http://camunda.org/schema/1.0/dmn" >  \n' +
          '</definitions>'
      this.openDiagram(empty)
    }
  },
  methods: {
    readDiagram(dmnXml) {
      // (1.1) migrate to DMN 1.3 if necessary
      migrateDiagram(dmnXml).then(value => {
        this.xmlHash = this.hash(value)
        this.openDiagram(value)
      });
      reloadCases()
    },
    tabClick(view) {
      this.modeler.open(view);
    },
    testing() {
      const definitions = this.modeler.getDefinitions();
      const decisions = getInputVariables(definitions);
      updateVariables(this.definition, decisions)
      this.decisions = decisions
    },
    downloadXml() {
      this.modeler.saveXML({format: true}, function (err, xml) {
        if (err) {
          return console.error('could not save DMN 1.1 diagram', err);
        }
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(xml));
        element.setAttribute('download', this.definition.resource);
        element.setAttribute('target', '_blank');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }.bind(this));
    },
    publishXml() {
      if (this.definition.resource.indexOf('.dmn') === -1) {
        this.$bvToast.toast(`dmn file name is empty!`, {
          title: 'Emtpty dmn resource',
          variant: 'danger',
          autoHideDelay: 5000,
          appendToast: true
        })
        return
      }
      this.modeler.saveXML({format: true}, function (err, xml) {
        if (err) {
          return console.error('could not save DMN 1.1 diagram', err);
        }
        const folder = rootFolderPath(this.definition.resource)
        const file = path.join(folder, this.definition.resource)

        writeFile(this.definition.resource, file, xml)
        const tenantId = this.$store.getters["tenantId"]
        const payload = {
          xml,
          tenantId,
          fileName: this.definition.resource,
          deploymentName: this.definition.name ?? this.definition.resource,
        }
        const host = this.$store.getters["host"]
        const publishUrl = `${host}/camunda/publish`;
        this.xmlHash = this.hash(xml)
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
          this.$bvToast.toast(`${this.definition.resource}`, {
            title: 'Dmn published',
            variant: 'success',
            autoHideDelay: 5000,
            appendToast: true
          })
          const {deployedDecisionDefinitions} = data
          if (deployedDecisionDefinitions)
            for (let i of Object.keys(deployedDecisionDefinitions)) {
              if (deployedDecisionDefinitions[i].key === this.definition.key || !this.definition.key) {
                const definition = {...deployedDecisionDefinitions[i]}
                this.$router.replace({name: 'Dmn', params: {id: definition.id}})
                this.definition = definition
                this.testing()
                break
              }
            }
        })
      }.bind(this));
    },
    evaluate(item) {
      if (this.activeView.type === 'drd') {
        const view = this.views.filter(c => c.id === item.decisionId)[0]
        this.tabClick(view)
      }
      const extractedVariables = extractDependencyVariables(item, this.decisions);
      this.currentTestInputFields = extractedVariables
      this.modeler.saveXML({format: true}, function (err, xml) {
            const {xmlHash} = this
            const newHash = this.hash(xml)
            if (xmlHash !== newHash) {
              this.$bvToast.toast(`Diagram has unpublished changes!`, {
                title: 'Unpublished Changes',
                variant: 'danger',
                autoHideDelay: 5000,
                appendToast: true
              })
            }
            const host = this.$store.getters["host"]
            const engine = new EngineAPI(host)
            const isInvalid = engine.validateParams({decision: item, extractedVariables})

            if (!isInvalid) {
              const from = new Date()
              const variables = extractedVariables.map(({key, value, type}) => {
                return {
                  name: key,
                  value,
                  type
                }
              })
              engine.evaluateDecision({
                tenantId: this.definition.tenantId,
                decision: item,
                variables: variables
              }).then(result => {
                item.testResult = result
                if (!result.type) {
                  const definitions = this.modeler.getDefinitions();
                  this.currentTestOutputFields = getOutputVariables(definitions, item.decisionId)
                  this.currentTest = item
                  this.$refs.testResultsModal.show()

                  engine.evaluateHistory({
                    from,
                    decisionRequirementsDefinitionId: this.definition.decisionRequirementsDefinitionId
                  }).then(value => {
                    this.currentTestResults = value
                    this.highlightResults()
                  })

                }
              }).catch(reason => {
                alert(reason)
              });
            } else {
              item.testResult = isInvalid
            }

          }.bind(this)
      )
      ;

    },
    closeModal() {
      this.$refs.testResultsModal.hide()
    },
    highlightResults() {
      this.highlight.control.realInputClear()
      this.highlight.control.realOutputClear()
      this.highlight.control.clearHighlightRow('highlight')
      const {id} = this.activeView
      const result = this.currentTestResults.filter(c => c.decisionDefinitionKey === id)[0]
      if (result) {
        const highlightRules = result.outputs.map(c => c.ruleId).filter((value, index, self) => self.indexOf(value) === index)
        for (let i of highlightRules) {
          this.highlight.control.highlightRow(i, 'highlight')
        }
        this.highlight.control.realInputAdd(result)
        this.highlight.control.realOutputAdd(result)
      }
    },
    openDiagram(dmnXML) {

      // import diagram
      this.modeler.importXML(dmnXML, function (err) {

        if (err) {
          return console.error('could not import DMN 1.1 diagram', err);
        }

        const activeEditor = this.modeler.getActiveViewer();

        // access active editor components
        const canvas = activeEditor.get('canvas');
        if (canvas)
          canvas.zoom('fit-viewport');
        this.testing()
        registerDmnHighlihgt(this.modeler, this.highlight, this.$refs.editor)
      }.bind(this));
    }
    ,
    hash(str, seed = 0) {
      let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
      for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }
  }
}
</script>

