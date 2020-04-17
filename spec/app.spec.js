const chai = require("chai");
const { expect } = require("chai");
const request = require("supertest");
const app = require("../app");
const connection = require("../db/connection");

process.env.NODE_ENV = "test";
chai.use(require("chai-sorted"));

beforeEach(() => {
  return connection.seed.run();
});
after(() => connection.destroy());

describe("INVALID METHODS", () => {
  it("Status:405", () => {
    return request(app)
      .put("/api/articles")
      .expect(405)
      .then(({ body }) => {
        expect(body.msg).to.equal("405 method not allowed");
      });
  });
});
describe("/api", () => {
  // describe("ROUTE NOT FOUND", () => {
  //   it.only("Status 404 - responds with route not found", () => {
  //     return request(app)
  //       .get("/api/incorrect")
  //       .expect(404)
  //       .then(({ body }) => {
  //         expect(body.msg).to.equal("route not found");
  //       });
  //   });
  // });
  describe("/topics", () => {
    it("GET: Status 200 - responds with an array of topic objects containing the correct keys", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then(({ body }) => {
          expect(body.topics).to.be.an("array");
          expect(body.topics[0]).to.contain.keys("description", "slug");
        });
    });
  });
  describe("/users", () => {
    it("GET: Status 200 - responds with a user object when passed their username", () => {
      return request(app)
        .get("/api/users?username=butter_bridge")
        .expect(200)
        .then(({ body }) => {
          expect(body.users).to.be.an("array");
          expect(body.users[0]).to.contain.keys(
            "username",
            "avatar_url",
            "name"
          );
          expect(body.users).to.have.lengthOf(1);
        });
    });
    it("GET: 404 - responds with an error when username does not exist", () => {
      return request(app)
        .get("/api/users?username=incorrect")
        .expect(404)
        .then(({ body }) => {
          expect(body.msg).to.equal("username does not exist");
        });
    });
  });

  describe("/articles", () => {
    it("GET: Status 200 - responds with an array of article objects containing the correct keys and a comment count", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body }) => {
          expect(body.articles).to.be.an("array");
          expect(body.articles[0]).to.include.keys(
            "article_id",
            "title",
            "topic",
            "author",
            "body",
            "votes",
            "created_at",
            "comment_count"
          );
        });
    });
    it("responds sorted by date and ordered by desc by default", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body }) => {
          expect(body.articles).to.be.descendingBy("created_at");
        });
    });
    it("accepts a sorted_by query only and orders by default", () => {
      return request(app)
        .get("/api/articles?sorted=votes")
        .expect(200)
        .then(({ body }) => {
          expect(body.articles).to.be.descendingBy("votes");
        });
    });
    it("accepts an ordered_by query only and sorts by default", () => {
      return request(app)
        .get("/api/articles?ordered=ascend")
        .expect(200)
        .then(({ body }) => {
          expect(body.articles).to.be.ascendingBy("created_at");
        });
    });
    it("accepts an ordered_by and sorted_by query", () => {
      return request(app)
        .get("/api/articles?sorted=votes&ordered=ascend")
        .expect(200)
        .then(({ body }) => {
          expect(body.articles).to.be.ascendingBy("votes");
        });
    });
    it("accepts an author query", () => {
      return request(app)
        .get("/api/articles?author=butter_bridge")
        .expect(200)
        .then(({ body }) => {
          body.articles.forEach((article) => {
            expect(article.author).to.equal("butter_bridge");
          });
        });
    });
    it("accepts topic query", () => {
      return request(app)
        .get("/api/articles?topic=mitch")
        .expect(200)
        .then(({ body }) => {
          body.articles.forEach((article) => {
            expect(article.topic).to.equal("mitch");
          });
        });
    });
    it("Status 400 - responds with error when column doesnt exists", () => {
      return request(app)
        .get("/api/articles?sorted=nothing")
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).to.equal("column not found");
        });
    });

    describe("/:article_id", () => {
      it("GET: Status 200 - responds with an article object when passed an ID", () => {
        return request(app)
          .get("/api/articles/1")
          .expect(200)
          .then(({ body }) => {
            expect(body.articles).to.be.an("object");
            expect(body.articles).to.include.keys(
              "article_id",
              "title",
              "body",
              "votes",
              "topic",
              "author",
              "created_at",
              "comment_count"
            );
          });
      });
      it("GET: 404 - responds with an error when article does not exist", () => {
        return request(app)
          .get("/api/articles/112345")
          .expect(404)
          .then(({ body }) => {
            expect(body.msg).to.equal("article_id does not exist");
          });
      });
      it("PATCH: 200 - responds with an article object with incremented votes ", () => {
        return request(app)
          .patch("/api/articles/1")
          .send({ inc_votes: 1 })
          .expect(200)
          .then(({ body }) => {
            expect(body.article).to.be.an("object");
            expect(body.article.votes).to.equal(101);
          });
      });
      it("PATCH: 200 - responds with an article object with decremented votes ", () => {
        return request(app)
          .patch("/api/articles/1")
          .send({ inc_votes: -1 })
          .expect(200)
          .then(({ body }) => {
            expect(body.article).to.be.an("object");
            expect(body.article.votes).to.equal(99);
          });
      });
      it("PATCH: 404 - responds 404 not found for an incorrect ID", () => {
        return request(app)
          .patch("/api/articles/123456789")
          .send({ inc_votes: 1 })
          .expect(404)
          .then(({ body }) => {
            expect(body.msg).to.equal("article_id does not exist");
          });
      });
      it("POST: 201 - responds with a newly added comment to the article_id", () => {
        return request(app)
          .post("/api/articles/1/comments")
          .send({ username: "butter_bridge", body: "This is a post" })
          .expect(201)
          .then(({ body }) => {
            expect(body.comment).to.have.all.keys([
              "comment_id",
              "author",
              "article_id",
              "votes",
              "created_at",
              "body",
            ]);
          });
      });
      it("Status:400 when missing required columns", () => {
        return request(app)
          .post("/api/articles/1/comments")
          .send({ body: "This is a post" })
          .expect(400)
          .then(({ body }) => {
            expect(body.msg).to.equal("missing required columns");
          });
      });
      it.only("GET: 200 - responds with an array of comments for a given article", () => {
        return request(app)
          .get("/api/articles/1/comments")
          .expect(200)
          .then(({ body }) => {
            console.log(body);
            expect(body.comments).to.be.an("array");
            expect(body.comments[0]).to.include.keys(
              "comment_id",
              "votes",
              "created_at",
              "author",
              "body"
            );
          });
      });
    });
    describe("/comments", () => {
      describe("/:comment_id", () => {
        it("PATCH: 200 - responds with a comment object with incremented votes ", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({ inc_votes: 1 })
            .expect(200)
            .then(({ body }) => {
              expect(body.comment).to.be.an("object");
              expect(body.comment.votes).to.equal(17);
            });
        });
        it("PATCH: 404 - responds 404 not found for an incorrect ID", () => {
          return request(app)
            .patch("/api/comments/123456789")
            .send({ inc_votes: 1 })
            .expect(404)
            .then(({ body }) => {
              expect(body.msg).to.equal("comment_id does not exist");
            });
        });
        it("DELETE: 204 - deletes a given comment by comment_id", () => {
          return request(app).delete("/api/comments/1").expect(204);
          // .then(() => {
          //   return request(app).get("/api/comments/1").expect(404);
          // });
        });
      });
    });
  });
});
