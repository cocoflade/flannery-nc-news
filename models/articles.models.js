const connection = require("../db/connection");

exports.selectArticlesByID = ({ article_id }) => {
  return connection
    .select("articles.*")
    .from("articles")
    .join("comments", "comments.article_id", "articles.article_id")
    .groupBy("articles.article_id")
    .count("comment_id as comment_count")
    .where({ "articles.article_id": article_id })
    .then((articles) => {
      if (articles.length === 0)
        return Promise.reject({
          status: 404,
          msg: "article_id does not exist",
        });
      return articles[0];
    });
};

exports.selectArticles = ({ sorted = "created_at", ordered = "desc" }) => {
  return connection
    .select("articles.*")
    .from("articles")
    .join("comments", "comments.article_id", "articles.article_id")
    .groupBy("articles.article_id")
    .count("comment_id as comment_count")
    .orderBy(sorted, ordered);
};

exports.editArticles = (article_id, inc_votes) => {
  return connection("articles")
    .increment("votes", inc_votes)
    .where({ article_id })
    .returning("*")
    .then((article) => {
      if (article.length === 0)
        return Promise.reject({
          status: 404,
          msg: "article_id does not exist",
        });
      return article[0];
    });
};
