import {Decision, Definition, InputParameter, TestCase} from "@/types/tests";
import {BFSRequire} from 'browserfs'
import Vue from "vue"

const fs = BFSRequire('fs');
const path = BFSRequire('path');
const git = require('isomorphic-git')

export const eventBus = new Vue()

export function rootFolderPath(resource: string) {
    const rootFolder = '/'
    if (!fs.existsSync(rootFolder))
        fs.mkdirSync(rootFolder)
    const folderPath = path.join(rootFolder, resource.replace('.dmn', ''))
    if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath)
    return folderPath;
}

function testsFolderPath(resource: string, decisionId: string) {
    const fp = rootFolderPath(resource);
    const folderPath = path.join(fp, decisionId)
    if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath)
    return folderPath;
}

function testsContentPath(resource: string, decisionId: string) {
    const fp = testsFolderPath(resource, decisionId);
    const filePath = path.join(fp, 'content.json')
    return filePath;
}

function savePath(resource: string): string {
    const fp = rootFolderPath(resource);

    const savePath = path.join(fp, 'variables.json')
    return savePath;
}

function saveFile(resource: string, variables: any) {
    const sPath = savePath(resource);

    writeFile(resource, sPath, JSON.stringify(variables, null, 2))
}

function readFile(resource: string): any {
    const sPath = savePath(resource);
    if (fs.existsSync(sPath)) {
        const text = fs.readFileSync(sPath, "utf8")
        return JSON.parse(text)
    }
}

export const saveVariables = (definition: Definition, decisions: Decision[]) => {
    const {resource} = definition
    const saveVariables = {} as any

    for (let {decision, decisionId, variables} of decisions) {
        saveVariables[decisionId] = {
            decision,
            variables: {} as any,
            customVariables: []
        }
        for (let {custom, key, name, type, value} of variables) {
            if (custom) {
                saveVariables[decisionId].customVariables.push({key, name, type, value})
            } else {
                saveVariables[decisionId].variables[key] = {
                    name,
                    type,
                    value
                }
            }
        }
    }
    saveFile(resource, saveVariables);
}

export const updateVariables = (definition: Definition, decisions: Decision[]) => {
    const {resource} = definition
    const savedVariables = readFile(resource)
    if (savedVariables) {
        for (let {decisionId, variables} of decisions) {
            const savedDecisionVariables = savedVariables[decisionId]
            if (savedDecisionVariables) {
                for (let item of variables) {
                    const savedProp = savedDecisionVariables.variables[item.key]
                    if (savedProp && item.type === savedProp.type) {
                        item.value = savedProp.value
                    }
                }
                for (let {key, name, type, value} of savedDecisionVariables.customVariables) {
                    variables.push({key, name, type, value, custom: true})
                }
            }

        }
    }
}

function getInputHash(input: InputParameter[]) {
    const inputHash = hash(input.map(({key, type, value}) => {
        return [key, type, value].join()
    }).join())
    return inputHash;
}

function getOutputHash(output: any[]) {
    const outputHash = hash(output.map(v => {
        return Object.keys(v).map(k => {
            const {type, value} = v[k]
            return [k, type, value].join()
        }).join()
    }).join())
    return outputHash;
}

function updateContentMetadata(resource: string, decisionId: string, inputHash: number, tp: string, fileName: string) {
    const contentPath = testsContentPath(resource, decisionId)
    let content = undefined
    if (fs.existsSync(contentPath)) {
        content = JSON.parse(fs.readFileSync(contentPath, 'utf8'))
    } else {
        content = {}
    }
    if (content[inputHash]) {
        const filePath = path.join(tp, content[inputHash])
        if (fs.existsSync(filePath))
            fs.unlinkSync(filePath)
    }

    content[inputHash] = fileName

    writeFile(resource, contentPath, JSON.stringify(content, null, 2))
}

export const compareResult = (oldOutput: any[], newOutput: any[]): { items: any[], hasChanges: boolean } => {

    const result: any[] = []

    const compareResult: any = {}

    function rowHash(v: any) {
        const rowHash = hash(Object.keys(v).map(k => {
            const {value} = v[k]
            return [k, value].join()
        }).join())

        if (!compareResult[rowHash])
            compareResult[rowHash] = {}
        return rowHash;
    }

    oldOutput.map((v, index) => {
        const h = rowHash(v);
        const d: any = {}
        Object.keys(v).map(key => {
            d[key] = v[key].value
        })
        compareResult[h].o = {
            row_num: index,
            data: d
        }
    })

    newOutput.map((v, index) => {
        const h = rowHash(v);
        const d: any = {}
        Object.keys(v).map(key => {
            d[key] = v[key].value
        })
        compareResult[h].n = {
            row_num: index,
            data: d
        }
    })
    let hasChanges = false
    for (let i of Object.keys(compareResult)) {
        const row = compareResult[i]
        let resultRow: any = undefined
        if (row.o && row.n) {
            resultRow = {
                '#row': undefined,
                ...row.o.data,
                _rowVariant: undefined,
                _cellVariants: {}
            }
            if (row.o.row_num !== row.n.row_num) {
                resultRow['#row'] = `${row.o.row_num + 1}->${row.n.row_num + 1}`
                resultRow._cellVariants['#row'] = 'warning'
                resultRow._hasChanges = true
            } else {
                resultRow['#row'] = `${row.o.row_num + 1}`
            }
        } else if (row.o) {
            resultRow = {
                '#row': `${row.o.row_num + 1}`,
                ...row.o.data,
                _rowVariant: 'danger'
            }
            hasChanges = true
        } else if (row.n) {

            const rowNum = `${row.n.row_num + 1}`
            const existRow = result.filter(c => c._rowVariant === 'danger' && c['#row'] === rowNum)[0]
            if (existRow) {
                existRow._rowVariant = undefined
                existRow._cellVariants = {}
                for (let k of Object.keys(row.n.data)) {
                    const oc = existRow[k]
                    const nc = row.n.data[k]
                    if (oc !== nc) {
                        if (oc && nc) {
                            existRow._cellVariants[k] = 'warning'
                        } else if (oc) {
                            existRow._cellVariants[k] = 'danger'
                        } else if (nc) {
                            existRow._cellVariants[k] = 'success'
                        }
                        existRow[k] = `${oc}->${nc}`
                    }
                }
            } else {
                resultRow = {
                    '#row': rowNum,
                    ...row.n.data,
                    _rowVariant: 'success'
                }
                hasChanges = true
            }


        }
        if (resultRow)
            result.push(resultRow)
    }

    return {
        items: result,
        hasChanges
    }
}

export const getTestCaseByHash = (definition: Definition, decisionId: string, inputHash: number): TestCase | undefined => {
    const {resource} = definition
    const tp = testsFolderPath(resource, decisionId)
    const contentPath = testsContentPath(resource, decisionId)
    if (fs.existsSync(contentPath)) {
        {
            const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'))
            if (content[inputHash]) {
                const filePath = path.join(tp, content[inputHash])
                if (fs.existsSync(filePath))
                    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
            }
        }
    }
}

export const getTestCase = (decisionId: string, definition: Definition, input: InputParameter[]): TestCase | undefined => {
    const inputHash = getInputHash(input);
    return getTestCaseByHash(definition, decisionId, inputHash);
}

export const listTestCases = (decisionId: string, definition: Definition): any[] | undefined => {
    const {resource} = definition
    const contentPath = testsContentPath(resource, decisionId)
    if (fs.existsSync(contentPath)) {
        {
            const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'))
            return Object.keys(content).map(hash => {
                return {hash, name: content[hash]}
            })
        }
    }
}

export const saveTestCase = (decisionId: string, name: string, definition: Definition, input: InputParameter[], output: any[]) => {
    const {resource} = definition
    const tp = testsFolderPath(resource, decisionId)
    const inputHash = getInputHash(input);
    const outputHash = getOutputHash(output);

    const testCase: TestCase = {
        name,
        decisionId,
        input: {
            hash: inputHash,
            data: input
        },
        output: {
            hash: outputHash,
            data: output
        }
    }


    const fileName = `${name.replace(/[/\\?%*:|"<>]/g, '-')}.json`

    updateContentMetadata(resource, decisionId, inputHash, tp, fileName);

    const testCaseFileName = path.join(tp, fileName)
    writeFile(definition.resource, testCaseFileName, JSON.stringify(testCase, null, 2))

    eventBus.$emit(`updateCase${decisionId}`, {})
}

export function reloadCases() {
    eventBus.$emit(`reloadCases`, {})
}

export function writeFile(resource: string, filePath: string, data: string) {
    fs.writeFile(filePath, data, "utf8", e => {
        if (e)
            console.error(e)
        else {
            const folder = rootFolderPath(resource)
            git.getConfig({
                fs,
                dir: folder,
                path: 'remote.origin.url'
            }).then((value: any) => {
                const relative = path.relative(folder, filePath)
                if (value)
                    git.add({fs, dir: folder, filepath: relative}).catch(console.error)
            })
        }
    })
}

function hash(str: string, seed = 0): number {
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
