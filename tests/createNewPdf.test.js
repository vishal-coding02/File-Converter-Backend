const request = require("supertest");
const app = require("../index");

describe("Testing - PDF API", () => {
  it("should create a newPdf", async () => {
    const res = await request(app)
      .post("/newPdf")
      .field(
        "text",
        JSON.stringify({
          textContent: "hello vishal kaise ho?",
          textFont: "Helvetica",
          textAlign: "left",
        })
      );
  });

  it("should create a newImaegPdf", async () => {
    const res = await request(app)
      .post("/newPdf")
      .field(
        "image",
        "E:BACKENDExpress JSMULTERFiles ConverterFile-Converter-Backend\testsai-generated-picture-of-a-tiger-walking-in-the-forest-photo.jpg"
      );
  });
});
