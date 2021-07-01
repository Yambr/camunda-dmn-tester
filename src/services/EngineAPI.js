import axios from "axios";
import moment from "moment";


export default class EngineAPI {
    constructor(restEndpoint) {
        this.restEndpoint = restEndpoint;
    }

    async evaluateDecision({tenantId, decision, variables}) {
        const payload = this.getPayload(tenantId, decision, variables);

        const headers = {
            accept: 'application/json'
        };
        const {data} = await axios.post(this.restEndpoint + '/camunda/evaluateDecision', payload)


        return data;
    }

    async evaluateHistory({from, decisionRequirementsDefinitionId}) {
        const now_utc = new Date(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(),
            from.getUTCHours(), from.getUTCMinutes(), from.getUTCSeconds()-2);
        const now = moment(now_utc).format('YYYY-MM-DDTHH:mm:ss.SSS[GMT]Z')
        const {data} = await axios.get(this.restEndpoint + `/camunda/evaluateHistory?decisionRequirementsDefinitionId=${decisionRequirementsDefinitionId}&evaluatedAfter=${now}`)
        return data;
    }

    validateParams({decision, extractedVariables}) {
        const errors = []
        const variables = extractedVariables.map(({key, value, type}) => {
            return {
                name: key,
                value,
                type
            }
        })
        const context = this.getContext(variables);


        for (const {value, required, name, key} of extractedVariables) {
            if (required && value === undefined) {
                errors.push(`"${name ?? key}"  is required for "${decision.decision}" `)
            }
        }
        const {downstreamDecisions} = decision
        for (const {decisionLogic, name} of downstreamDecisions) {
            try {
                const {text, expressionLanguage} = decisionLogic
                if (expressionLanguage === "javascript") {
                    this.evalInScope(text, context)
                }
            } catch (e) {
                errors.push(`literalExpression "${name}" : ${e}`)
            }
        }
        if (errors.length)
            return {type: 'InvalidParams', messages: errors};
        else
            return false
    }

    evalInScope(code, args = {}) {
        // Call is used to define where "this" within the evaluated code should reference.
        // eval does not accept the likes of eval.call(...) or eval.apply(...) and cannot
        // be an arrow function
        return function evaluateEval() {
            // Create an args definition list e.g. "arg1 = this.arg1, arg2 = this.arg2"
            const argsStr = Object.keys(args)
                .map(key => `${key} = this.${key}`)
                .join(',');
            const argsDef = argsStr ? `let ${argsStr};` : '';
            const codeText = `${argsDef}${code}`
            return eval(codeText);
        }.call(args);
    }

    getContext(variables) {
        const context = {};

        for (const {name, type, value} of variables) {
            if (name)
                context[name] = value;
            if (value !== undefined) {
                // cast types when required
                if (type === 'boolean') {
                    context[name] = Boolean(value);
                } else if (['integer', 'long', 'double'].includes(type)) {
                    context[name] = Number(value);
                }
            }
        }

        return context;
    }

    getPayload(tenantId, decision, variables) {
        const payload = {
            decision: decision.decisionId,
            tenantId,
            variables: {}
        };

        for (const {name, type, value} of variables) {
            payload.variables[name] = {type, value};

            // cast types when required
            if (type === 'boolean') {
                payload.variables[name].value = Boolean(value);
            } else if (['integer', 'long', 'double'].includes(type)) {
                payload.variables[name].value = Number(value);
            }
        }

        return payload;
    }
}
