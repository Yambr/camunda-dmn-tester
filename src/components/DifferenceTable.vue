<template>
  <div>
    <h4>{{ testCase.name }}
      <b-icon-check-circle v-if="!hasChanges" variant="success"></b-icon-check-circle>
      <b-icon-exclamation-triangle-fill v-if="hasChanges" variant="warning"></b-icon-exclamation-triangle-fill>
    </h4>
    <b-table responsive small :items="items"></b-table>
  </div>
</template>
<script>
import {compareResult} from "../services/TestsStore";

export default {
  name: 'DifferenceTable',
  props: {
    output: {},
    testCase: {}
  },
  data() {
    return {
      items: undefined,
      hasChanges: false
    }
  },
  mounted() {
    const {items, hasChanges} = compareResult(this.testCase.output.data, this.output)
    this.items = items
    this.hasChanges = hasChanges
  }
}
</script>