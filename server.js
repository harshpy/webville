const express = require("express");
const app = express();
const port = 3000;
const logger = require("morgan");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
var jsonParser = bodyParser.json({
  limit: '10mb'
});
app.use(logger("dev"));
app.use(jsonParser);

const profilepic = require("./routes/proficepic");
const users = require("./routes/users")
app.use("/users", profilepic);
app.use("/users", users);

app.listen(port, () => {
  console.log(`server running on port ${port}!`);
});