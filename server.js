const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "src")));

// Adapter: turns a Netlify handler into an Express route
function wrapNetlifyHandler(handlerModule) {
  return async (req, res) => {
    const event = {
      httpMethod: req.method,
      body: JSON.stringify(req.body),
      headers: req.headers,
      queryStringParameters: req.query,
    };
    const result = await handlerModule.handler(event, {});
    res.status(result.statusCode).set(result.headers || {}).send(result.body);
  };
}

const analyze = require("./netlify/functions/analyze.js");
const analyzeSections = require("./netlify/functions/analyze-sections.js");
const rewriteBullets = require("./netlify/functions/rewrite-bullets.js");

app.post("/api/analyze", wrapNetlifyHandler(analyze));
app.post("/api/analyze-sections", wrapNetlifyHandler(analyzeSections));
app.post("/api/rewrite-bullets", wrapNetlifyHandler(rewriteBullets));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ResumeLens running on port ${PORT}`));