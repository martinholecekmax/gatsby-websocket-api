require("dotenv").config();

const http = require("http");
const express = require("express");
const app = express();

const cors = require("cors");
const bodyParser = require("body-parser");

const server = http.createServer(app);

require("./src/services/socket").getInstance(server);

const routes = require("./src/routes");
const buildQueue = require("./src/services/queue").getInstance();
const { job } = require("./src/jobs/job");

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use("/", routes);

buildQueue.process(job);

server.listen(process.env.PORT, () => {
  console.log(`listening on ${process.env.HOST}:${process.env.PORT}`);
});
