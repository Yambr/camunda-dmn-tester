export interface Definition {
    id: string;
    key: string;
    category: string;
    name: string;
    version: number;
    resource: string;
    deploymentId: string;
    tenantId: string;
    decisionRequirementsDefinitionId: string;
    decisionRequirementsDefinitionKey: string;
    historyTimeToLive: null;
    versionTag: null;
}

export interface Decision {
    decision: string;
    decisionId: string;
    variables: VariableElement[];
    downstreamDecisions: DownstreamDecision[];
    testResult: any;
}

export interface DownstreamDecision {
    $type: string;
    id: string;
    name: string;
    variable: DownstreamDecisionVariable;
    decisionLogic: DecisionLogic;
}

export interface DecisionLogic {
    $type: string;
    id: string;
    expressionLanguage: string;
    text: string;
}

export interface DownstreamDecisionVariable {
    $type: string;
    id: string;
    name: string;
    typeRef: string;
}

export interface ValueInfo {
}

export interface VariableElement {
    name?: string;
    type: string;
    expression?: string;
    key: string;
    value?: boolean | string;
    required?: boolean;
    inputValues?: string[];
    inputVariable?: string;
    custom?: boolean;
}

export interface DmnHistory {
    id: string;
    decisionDefinitionId: string;
    decisionDefinitionKey: string;
    decisionDefinitionName: string;
    evaluationTime: string;
    removalTime: null;
    processDefinitionId: null;
    processDefinitionKey: null;
    processInstanceId: null;
    rootProcessInstanceId: null;
    caseDefinitionId: null;
    caseDefinitionKey: null;
    caseInstanceId: null;
    activityId: null;
    activityInstanceId: null;
    userId: null;
    inputs: Put[];
    outputs: Put[];
    collectResultValue: null;
    rootDecisionInstanceId: null | string;
    decisionRequirementsDefinitionId: string;
    decisionRequirementsDefinitionKey: string;
    tenantId: string;
}

export interface ResultValue {
    type: Type;
    value: boolean | number | null | string;
    valueInfo: ValueInfo;
}

export interface Put extends ResultValue {
    id: string;
    decisionInstanceId: string;
    clauseId: null | string;
    clauseName: null | string;
    errorMessage: null;
    createTime: string | null;
    removalTime: null;
    rootProcessInstanceId: null;
    ruleId?: string;
    ruleOrder?: number | null;
    variableName?: string;
}

export interface InputParameter {
    name: string;
    key: string;
    type: Type;
    value?: boolean | string | number | null;
}

export interface TestCaseData {
    hash: number,
    data: any
}

export interface TestCase {
    name: string
    decisionId: string
    input: TestCaseData
    output: TestCaseData
}

export enum Type {
    Boolean = "Boolean",
    Double = "Double",
    Integer = "Integer",
    Long = "Long",
    Null = "Null",
    String = "String",
}
