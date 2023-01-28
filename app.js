const express = require("express");
const session = require("express-session");
const { Guid } = require("js-guid");
const mongoose = require("mongoose");
const redis = require("connect-redis");
const Storage = require("node-storage");
const cors = require("cors");
const soap = require("soap");
const cli = require("nodemon/lib/cli");

const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
const store = new Storage("./keys/keys.js");

const guid = Guid.newGuid().StringGuid;

app.get("/", (req, res) => {
  store.put(req.query.key, guid);
  return res.json({
    guid: guid,
    success: true,
  });
});

app.post("/pkcs7", async (req, res) => {
  const url = "http://127.0.0.1:9090/dsvs/pkcs7/v1?wsdl";
  var args = { pkcs7B64: req.body.pkcs };
  const client = await soap.createClientAsync(url, {});
  // console.log(client);
  const pkcs7Result = await client.Pkcs7Service.Pkcs7Port.verifyPkcs7(
    args,
    function (err, result) {
      // console.log(typeof result);
      const jsonDoc = JSON.parse(result.return);

      // console.log(
      //   jsonDoc.pkcs7Info.signers[0],
      //   "------____certificate_____-------",
      //   // jsonDoc.pkcs7Info.signers[0].validTo,
      //   "____json___"
      // );
      // checking certificate
      let certificateTime = new Date(
        jsonDoc.pkcs7Info.signers[0].certificate[0].validTo
      );
      let now = new Date(Date.now());
      if (certificateTime < now) {
        console.log("HA katta ekan");
      } else {
        console.log("HA adashdim");
      }
      res.status(200).json({
        message: "success",
        info: jsonDoc,
      });
      console.log(jsonDoc, "____jsonDoc______");
      return;
    }
  );
});

app.listen(PORT, () => {
  console.log("Server runing", PORT);
});
