const G_SCRIPT_URL = process.env.G_SCRIPT_URL;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // El frontend también hace GET para cargar datos
  if (event.httpMethod === "GET") {
    const params = event.queryStringParameters || {};
    let url = G_SCRIPT_URL;
    if (params.hoja)   url += `?hoja=${params.hoja}`;
    if (params.accion) url += `?accion=${params.accion}`;

    const res = await fetch(url);
    const data = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  }

  // POST → reenvía al Apps Script
  if (event.httpMethod === "POST") {
    const params = event.queryStringParameters || {};
    let url = G_SCRIPT_URL;
    if (params.accion) url += `?accion=${params.accion}`;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: event.body,
    });

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};