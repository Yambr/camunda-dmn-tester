import {is} from 'dmn-js-shared/lib/util/ModelUtil';

/**
 *
 * @param {ModdleElement} container is the root element from where to extract the input variables
 *
 * @returns {Array<decisions>}
 */
export function getInputVariables(container) {

    const allElements = container.drgElement;
    // (1) get decisions
    const decisions = getDecisions(container);

    const expressions = getExpressions(container);

    // (2) get downstream decisions
    const downstreamDecisions = getDownstreamDecisions(decisions, allElements);

    // (3) for each decision, map name, variables and their types. Also add the downstream decisions
    const result = decisions.map((decision) => {

        return {
            'decision': decision.name,
            'decisionId': decision.id,
            'variables': decision.decisionLogic.get('input').filter(input => !isOutput(input, decisions, expressions))
                .map((input) => {
                    let key = ''
                    let required = true
                    const {text, expressionLanguage} = input.inputExpression
                    console.log(decision.name, input.label,input)
                    if (text) {
                        if(expressionLanguage && expressionLanguage.toLowerCase() ==='javascript'){
                            if ((text.indexOf('Boolean(') > -1)) {
                                key = text.split('Boolean(')[1].trim().split(' ')[0]
                                if (key.indexOf('?') > -1)
                                    key = key.replace('?', '')
                                if (key.indexOf(')') > -1)
                                    key = key.replace(')', '')
                                required = false
                            }if ((text.indexOf('typeof') > -1)) {
                                key = text.split('typeof ')[1].trim().split(' ')[0]
                                if (key.indexOf('=') > -1)
                                    key = key.split('=')[0]
                                required = false
                            }
                        } else {
                            if (text.indexOf('.') === -1) {
                                key = text
                            } else if ((text.indexOf('variableContext.resolve') > -1)) {
                                key = text.split('variableContext.resolve')[1].split('\'')[1]
                                required = false
                            } else if ((text.indexOf('empty') > -1)) {
                                key = text.split('empty')[1].trim().split(' ')[0]
                                if (key.indexOf('?') > -1)
                                    key = key.replace('?', '')
                                required = false
                            }
                        }
                    } else {
                        key = input.inputVariable
                    }
                    if (!key)
                        required = false
                    const inputValues = input.inputValues && input.inputValues.text ? input.inputValues.text.split(',').map(c => JSON.parse(c)) : []
                    return {
                        'name': input.label,
                        'type': input.inputExpression.typeRef,
                        'expression': input.inputExpression.text,
                        'inputVariable': input.inputVariable,
                        'key': key,
                        'value': inputValues[0],
                        'required': required,
                        'inputValues': inputValues
                    };
                }),
            'downstreamDecisions': downstreamDecisions[decision.id],
            'testResult': null
        };
    });

    return result;
}

/**
 *
 * @param {ModdleElement} container is the root element from where to extract the output variables
 *
 * @returns {Array<decisions>}
 */
export function getOutputVariables(container, decisionId) {

    const decision = getDecisions(container).filter(c => c.id === decisionId)[0];
    return {
        'decision': decision.name,
        'decisionId': decision.id,
        'variables': decision.decisionLogic.get('output')
            .map(({label, name, type}) => {
                return {label, name, type};
            }),
    };
}

function _extractVariables(extractedDecisions, decision, variables, decisions, extractedVariables) {
    if (extractedDecisions.indexOf(decision.decisionId) === -1) {
        extractedDecisions.push(decision.decisionId)

        for (let {name, key, value, type, required} of decision.variables) {
            if (key && extractedVariables.indexOf(key) === -1) {
                variables.push({
                    name,
                    key,
                    type,
                    value,
                    required
                })
                extractedVariables.push(key)
            }
        }
        for (let {id} of decision.downstreamDecisions) {
            const dependentDecision = decisions.filter(c => c.decisionId === id)[0]
            if (dependentDecision)
                _extractVariables(extractedDecisions, dependentDecision, variables, decisions, extractedVariables)
        }
    }
}

export function extractDependencyVariables(decision, decisions) {
    const variables = []

    const extractedDecisions = []
    const extractedVariables = []
    _extractVariables(extractedDecisions, decision, variables, decisions, extractedVariables);


    return variables;
}

/**
 *
 * @param {ModdleElement} container is the root element from where to extract the decisions from
 *
 * @returns {Array<decisions>} an array of moddle decision elements
 */
function getDecisions(container) {

    return container.drgElement.filter((element) =>
        element &&
        element.$type === 'dmn:Decision'
        && is(element.decisionLogic, 'dmn:DecisionTable'));
}

/**
 *
 * @param {ModdleElement} container is the root element from where to extract the decisions from
 *
 * @returns {Array<decisions>} an array of moddle decision elements
 */
function getExpressions(container) {

    return container.drgElement.filter((element) =>
        element &&
        element.$type === 'dmn:Decision'
        && is(element.decisionLogic, 'dmn:LiteralExpression'));
}

/**
 * @param {Array<ModdleElement>} decisions an array of ModdleElements representing dmn decisions
 *
 * @param {Array<ModdleElement>} decisions an array of ModdleElements representing dmn decisions
 *
 * @returns {DownstreamDecisionsObject} an object which represents a map of decision.id : [<string>downstreamDecisionIds]
 */
function getDownstreamDecisions(decisions, allElements) {

    // (1) create a simple dependency map
    let downstreamDecisionMap = {};

    decisions.forEach(decision => {
        let downstreamDecisions = (decision.informationRequirement &&
            decision.informationRequirement.length > 0 &&
            decision.informationRequirement.filter(infoReq => infoReq.requiredDecision).length > 0) ?
            decision.informationRequirement.filter(infoReq => infoReq.requiredDecision)
                .map(infoReq => allElements.filter(el => el.id === infoReq.requiredDecision.href.slice(1))[0]) :
            [];

        downstreamDecisionMap[decision.id] = downstreamDecisions;
    });

    // (2) get the transient dependencies
    for (const decId in downstreamDecisionMap) {
        downstreamDecisionMap[decId] = getTransientDecIds(decId, downstreamDecisionMap).filter(uniqueFilter);
    }

    // (3) return result
    return downstreamDecisionMap;

    // helpers //////////

    function getTransientDecIds(decId, downstreamDecisionMap) {
        if (downstreamDecisionMap[decId] === undefined || downstreamDecisionMap[decId].length == 0) {
            return [];
        } else {
            return downstreamDecisionMap[decId]
                .concat(downstreamDecisionMap[decId]
                    .map(transId => getTransientDecIds(transId, downstreamDecisionMap))).flat();
        }
    }

    function uniqueFilter(element, index, array) {
        return array.indexOf(element) === index;
    }
}

/**
 *
 * @param {ModdleElement} input is a moddle element representing a DMN decision input
 * @param {Array<ModdleElement>} decisions an array of moddle element, each representing a DMN decision
 * @param {Array<ModdleElement>} expressions an array of moddle element, each representing a DMN decision
 *
 * @returns {boolean} will return a boolean indicating whether the input expression is also used as an output in one of the decisions
 */
function isOutput(input, decisions, expressions) {
    if (input &&
        input.inputExpression &&
        input.inputExpression.text) {
        const inputExp = input.inputExpression.text;

        const outputExpressions = getOutputExpressions(decisions, expressions);

        return outputExpressions.includes(inputExp) ? true : false;
    } else {
        return false;
    }
}

/**
 *
 * @param {Array<ModdleElement>} decisions an array of moddle element, each representing a DMN decision
 *
 * @param {Array<ModdleElement>} expressions an array of moddle element, each representing a DMN decision
 *
 * @returns {Array<string>} an array of strings, each the name of an output Expressions
 */
function getOutputExpressions(decisions, expressions) {
    const outputClauses = decisions.map(dec => dec.decisionLogic.output).flat();
    const outputLiteralClauses = expressions.map(dec => dec.variable.name)
    return outputLiteralClauses.concat(outputClauses.filter(clause => clause.name).map(clause => clause.name));
}
