import {Request, Response} from "express";

import axios from 'axios';
import FormData from 'form-data';


export const index = async (req: Request, res: Response) => {
    const camundaHost = process.env.CAMUNDA_HOST
    let url = `${camundaHost}/engine-rest/decision-definition?latestVersion=true&sortBy=name&sortOrder=asc`
    if (req.query.keyLike)
        url += `&keyLike=${req.query.keyLike}`
    const {data} = await axios.get(url)
    res.json(data);
};

export const definition = async (req: Request, res: Response) => {
    const camundaHost = process.env.CAMUNDA_HOST
    const {id} = req.query
    let url = `${camundaHost}/engine-rest/decision-definition/${id}`
    const {data} = await axios.get(url)
    res.json(data);
};

export const xml = async (req: Request, res: Response) => {
    const camundaHost = process.env.CAMUNDA_HOST
    let url = `${camundaHost}/engine-rest/decision-definition/${req.query.id}/xml`
    const {data} = await axios.get(url)
    res.json(data);
};

export const host = async (req: Request, res: Response) => {
    const camundaHost = process.env.CAMUNDA_HOST
    res.json(camundaHost);
};

export const deploymentDelete = async (req: Request, res: Response) => {
    const camundaHost = process.env.CAMUNDA_HOST
    const {id} = req.query
    let url = `${camundaHost}/engine-rest/deployment/${id}?cascade=true&skipCustomListeners=true&skipIoMappings=true`
    const response = await axios.delete(url)
    res.json(response.data);
};

export const publish = async (req: Request, res: Response) => {
    const camundaHost = process.env.CAMUNDA_HOST
    const {xml, tenantId, fileName, deploymentName} = req.body


    const formData = new FormData();
    const buffer = Buffer.from(xml, 'utf8')
    formData.append('data', buffer, fileName);
    formData.append('tenant-id', tenantId);
    formData.append('deployment-name', deploymentName);
    const contentLength = await formData.getLengthSync();
    try {
        const {data} = await axios(`/engine-rest/deployment/create`, {
            method: 'POST',
            baseURL: camundaHost,
            headers: {
                ...formData.getHeaders(),
                'content-length': contentLength
            },
            data: formData
        })
        res.json(data);
    } catch ({response}) {
        if (response)
            res.json(response.data);
        else
            res.status(400)
    }


};

export const evaluateDecision = async (req: Request, res: Response) => {
    const camundaHost = process.env.CAMUNDA_HOST
    const {decision, tenantId, variables} = req.body
    const url = `${camundaHost}/engine-rest/decision-definition/key/${decision}${tenantId ? `/tenant-id/${tenantId}` : ''}/evaluate`


    axios.post(url, {
        variables
    }).then(({data}) => {
        res.json(data);
    }).catch(reason => {
        const {data} = reason.response
        res.json(data);
    })


};

export const evaluateHistory = async (req: Request, res: Response) => {
    const camundaHost = process.env.CAMUNDA_HOST
    const {decisionRequirementsDefinitionId, evaluatedAfter} = req.query
    const url = `${camundaHost}/engine-rest/history/decision-instance?decisionRequirementsDefinitionId=${decisionRequirementsDefinitionId}&evaluatedAfter=${evaluatedAfter}&includeInputs=true&includeOutputs=true&disableBinaryFetching=true&disableCustomObjectDeserialization=true&maxResults=50`

    axios.get(url).then(({data}) => {
        res.json(data);
    }).catch(reason => {
        const {data} = reason.response
        res.json(data);
    })


};

