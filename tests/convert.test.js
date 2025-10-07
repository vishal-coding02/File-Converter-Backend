// tests/convert.test.js
const request = require("supertest");
const path = require("path");
const app = require("../index");

describe("Testing - Convert API", () => {
  it("should return 400 if no file is uploaded", async () => {
    const res = await request(app)
      .post("/convert")
      .field("convertFileType", "pdf");

    expect(res.status).toBe(400);
    expect(res.text).toBe("File not found.");
  });
});
