const https = require("https");

const sendWhatsAppTemplate = async (
  to,
  title,
  location,
  matchScore,
  url
) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: "nueva_oferta_trabajo",
        language: {
          code: "es_CL",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: title,
              },
              {
                type: "text",
                text: location || "No especificada",
              },
              {
                type: "text",
                text: String(matchScore),
              },
              {
                type: "text",
                text: url,
              },
            ],
          },
        ],
      },
    });

    const options = {
      hostname: "graph.facebook.com",
      path: `/v${process.env.WHATSAPP_API_VERSION.replace(
        "v",
        ""
      )}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const request = https.request(options, (response) => {
      let responseData = "";

      response.on("data", (chunk) => {
        responseData += chunk;
      });

      response.on("end", () => {
        if (
          response.statusCode >= 200 &&
          response.statusCode < 300
        ) {
          resolve(JSON.parse(responseData));
        } else {
          reject(
            new Error(
              `WhatsApp API respondió con HTTP ${response.statusCode}: ${responseData}`
            )
          );
        }
      });
    });

    request.on("error", reject);

    request.write(data);
    request.end();
  });
};

module.exports = {
  sendWhatsAppTemplate,
};