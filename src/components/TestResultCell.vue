<template>
  <div>
  <span v-if="!tooltip">
    {{ cellValue }}
  </span>
    <i v-if="tooltip" v-b-tooltip.hover :title="tooltip"> {{ cellValue }}</i>
  </div>
</template>
<script>
export default {
  name: 'TestResultCell',
  props: {
    value: {}
  },
  mounted() {
    const {value} = this.value
    if (value) {
      const str = `${value}`
      if (str.length < 20) {
        this.cellValue = str
      } else {
        this.cellValue = `${str.slice(0, 15)}...`
        this.tooltip = str
      }
    }

  },
  data() {
    return {
      cellValue: undefined,
      tooltip: undefined
    }
  }
}
</script>