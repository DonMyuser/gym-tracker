exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { password } = JSON.parse(event.body);
    const correct = process.env.APP_PASSWORD;

    if (!correct) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Contraseña no configurada en variables de entorno' }) };
    }

    if (password === correct) {
        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true, token: Buffer.from(correct).toString('base64') })
        };
    }

    return {
        statusCode: 401,
        body: JSON.stringify({ ok: false })
    };
};