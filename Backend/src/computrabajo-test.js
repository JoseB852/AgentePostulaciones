const https = require("https");

const url =
  "https://cl.computrabajo.com/trabajo-de-desarrollador-node-js";

https.get(url, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("HTTP:", res.statusCode);
    console.log("Tamaño:", data.length);
    console.log("");
    console.log(data.slice(0, 3000));
  });
}).on("error", (error) => {
  console.error("Error:", error.message);
});