import express from "express";

import dotenv from "dotenv";
import bodyParser from "body-parser";

import * as home from "./controllers/home.controller";
import * as camunda from "./controllers/camunda.controller";

const corsProxy = require('@isomorphic-git/cors-proxy/middleware.js')


dotenv.config();

const cors = require('cors')
const app = express();

const camundaHost = process.env.CAMUNDA_HOST
const options = {
    insecure_origins: [
        camundaHost
    ]
}
app.use(cors())
app.use(corsProxy(options))


app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: true}));
app.get("/", home.index);

app.get("/camunda", camunda.index);
app.get("/camunda/definition", camunda.definition);
app.get("/camunda/xml", camunda.xml);
app.get("/camunda/host", camunda.host);
app.post("/camunda/publish", camunda.publish);
app.delete("/camunda/delete", camunda.deploymentDelete);
app.post("/camunda/evaluateDecision", camunda.evaluateDecision);
app.get("/camunda/evaluateHistory", camunda.evaluateHistory);


app.listen(app.get("port"), () => {
    console.log(
        "App is running at http://localhost:%d in %s mode",
        app.get("port"),
        app.get("env")
    );
    console.log("Press CTRL-C to stop\n");
});

export default app;
