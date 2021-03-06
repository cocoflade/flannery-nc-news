const topicRouter = require("express").Router();
const { getTopics } = require("../controllers/topic.controllers");
const { handle405 } = require("../errors/index.errors");

topicRouter.route("/").get(getTopics).all(handle405);

module.exports = topicRouter;
