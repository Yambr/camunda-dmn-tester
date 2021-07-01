<template>
  <b-container>
    <b-row>
      <b-col>
        <b-table :items="files" light small striped hover outlined :fields="fields" @row-clicked="rowclicked">
          <template #cell(icon)="{item}">
            <b-icon-folder v-if="item.isDirectory"></b-icon-folder>
            <b-icon-file v-if="!item.isDirectory"></b-icon-file>
          </template>
        </b-table>
        <b-button @click="home">Домой</b-button>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import {BFSRequire} from 'browserfs'

const fs = BFSRequire('fs');
const path = BFSRequire('path');

export default {
  name: "Files",
  mounted() {
    this.refresh()
  },
  data() {
    return {
      files: undefined,
      fields: [
        {
          key: 'icon',
          label: ''
        },
        {
          key: 'path',
          sortable: true
        }
      ],
      currentFolder: '/'
    }
  },
  methods: {
    refresh() {

      fs.readdir(this.currentFolder, (err, files) => {
        if (err) {
          console.error(err)
        } else {

          this.files = files.map(c => {
            const itemPath = path.join(this.currentFolder, c)
            return {
              path: c,
              isDirectory: fs.statSync(itemPath).isDirectory()
            }
          })
        }
      })
    },
    rowclicked(item) {
      const itemPath = path.join(this.currentFolder, item.path)
      if (item.isDirectory) {
        this.currentFolder = itemPath
        this.refresh()
      } else {
        this.downloadFile(itemPath, item.path)
      }
    },
    downloadFile(filePath, fileName) {
      fs.readFile(filePath, 'utf8', (e, text) => {
        if (e)
          console.error(e)
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', fileName);
        element.setAttribute('target', '_blank');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      })
    },
    home() {
      this.currentFolder = '/'
      this.refresh()
    }
  }
}
</script>

<style scoped>

</style>