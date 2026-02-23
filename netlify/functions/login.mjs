import { getStore } from '@netlify/blobs';

export default async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        const store = getStore({ name: 'rate-limit', consistency: 'strong' });
        const ahora = Date.now();

        let intentos = [];
        try {
            const data = await store.get(ip, { type: 'json' });
            if (Array.isArray(data)) {
                intentos = data.filter(t => ahora - t < 15 * 60 * 1000);
            }
        } catch {}

        if (intentos.length >= 5) {
            const espera = Math.ceil((15 * 60 * 1000 - (ahora - intentos[0])) / 60000);
            return new Response(JSON.stringify({ ok: false, error: `Demasiados intentos. Espera ${espera} min.` }), {
                status: 429, headers: { 'Content-Type': 'application/json' }
            });
        }

        const body = await req.json();
        const correct = process.env.APP_PASSWORD;

        if (body.password === correct) {
            await store.set(ip, JSON.stringify([]));
            return new Response(JSON.stringify({ ok: true, token: Buffer.from(correct).toString('base64') }), {
                status: 200, headers: { 'Content-Type': 'application/json' }
            });
        }

        intentos.push(ahora);
        await store.set(ip, JSON.stringify(intentos));
        const restantes = 5 - intentos.length;
        return new Response(JSON.stringify({ ok: false, error: `Contraseña incorrecta. Te quedan ${restantes} intentos.` }), {
            status: 401, headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: 'Error interno: ' + err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
};