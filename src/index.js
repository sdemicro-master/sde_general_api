export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // GET /api - daftar service
    if (request.method === "GET" && url.pathname === "/api") {
      return jsonResponse({
        success: true,
        service: "Universal API SDE Micro",
        version: "1.0.0",
        services: [
          { method: "GET", endpoint: "/api", description: "Daftar service API" },
          { method: "GET", endpoint: "/api/sensor-data", description: "Mengambil semua data sensor" },
          { method: "GET", endpoint: "/api/sensor-data/{id}", description: "Mengambil data sensor berdasarkan ID" },
          { method: "POST", endpoint: "/api/sensor-data", description: "Menyimpan data sensor" }
        ]
      });
    }

    // GET /api/sensor-data
    if (request.method === "GET" && url.pathname === "/api/sensor-data") {
      try {
        const result = await env.DB.prepare(`
          SELECT id, device_id, temperature, humidity, co2, recorded_at
          FROM sensor_data
          ORDER BY id DESC
        `).all();

        return jsonResponse({
          success: true,
          count: result.results.length,
          data: result.results
        });
      } catch (error) {
        return jsonResponse({
          success: false,
          message: "Gagal mengambil data sensor",
          error: error.message
        }, 500);
      }
    }

    // GET /api/sensor-data/{id}
    if (
      request.method === "GET" &&
      url.pathname.startsWith("/api/sensor-data/")
    ) {
      try {
        const id = url.pathname.split("/").pop();

        if (!/^\d+$/.test(id)) {
          return jsonResponse({
            success: false,
            message: "ID harus berupa angka"
          }, 400);
        }

        const result = await env.DB.prepare(`
          SELECT id, device_id, temperature, humidity, co2, recorded_at
          FROM sensor_data
          WHERE id = ?
        `).bind(id).first();

        if (!result) {
          return jsonResponse({
            success: false,
            message: "Data sensor tidak ditemukan"
          }, 404);
        }

        return jsonResponse({
          success: true,
          data: result
        });
      } catch (error) {
        return jsonResponse({
          success: false,
          message: "Gagal mengambil data sensor",
          error: error.message
        }, 500);
      }
    }

    // POST /api/sensor-data
    if (request.method === "POST" && url.pathname === "/api/sensor-data") {
      try {
        const body = await request.json();
        const { device_id, temperature, humidity, co2 } = body;

        if (!device_id) {
          return jsonResponse({ success: false, message: "device_id wajib diisi" }, 400);
        }
        if (temperature === undefined || temperature === null) {
          return jsonResponse({ success: false, message: "temperature wajib diisi" }, 400);
        }
        if (humidity === undefined || humidity === null) {
          return jsonResponse({ success: false, message: "humidity wajib diisi" }, 400);
        }
        if (co2 === undefined || co2 === null) {
          return jsonResponse({ success: false, message: "co2 wajib diisi" }, 400);
        }

        const result = await env.DB.prepare(`
          INSERT INTO sensor_data
            (device_id, temperature, humidity, co2)
          VALUES (?, ?, ?, ?)
        `).bind(
          device_id,
          Number(temperature),
          Number(humidity),
          Number(co2)
        ).run();

        return jsonResponse({
          success: true,
          message: "Data sensor berhasil disimpan",
          data: {
            id: result.meta.last_row_id,
            device_id,
            temperature: Number(temperature),
            humidity: Number(humidity),
            co2: Number(co2)
          }
        }, 201);
      } catch (error) {
        return jsonResponse({
          success: false,
          message: "Gagal menyimpan data sensor",
          error: error.message
        }, 500);
      }
    }

    // Frontend static files
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return jsonResponse({
      success: false,
      message: "Endpoint tidak ditemukan",
      method: request.method,
      path: url.pathname
    }, 404);
  }
};
