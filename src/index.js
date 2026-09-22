export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
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

    // =========================================================
    // GET /api
    // Daftar service
    // =========================================================
    if (request.method === "GET" && url.pathname === "/api") {
      return jsonResponse({
        success: true,
        service: "Universal API SDE Micro",
        version: "1.1.0",

        services: [
          {
            method: "GET",
            endpoint: "/api",
            description: "Daftar service API"
          },

          {
            method: "GET",
            endpoint: "/api/sensor-data",
            description: "Mengambil semua data sensor"
          },

          {
            method: "GET",
            endpoint: "/api/sensor-data/{id}",
            description: "Mengambil data sensor berdasarkan ID"
          },

          {
            method: "POST",
            endpoint: "/api/sensor-data",
            description: "Menyimpan data sensor"
          },

          {
            method: "GET",
            endpoint: "/api/energy-meter",
            description: "Mengambil semua data energy meter"
          },

          {
            method: "GET",
            endpoint: "/api/energy-meter/{id}",
            description: "Mengambil data energy meter berdasarkan ID"
          },

          {
            method: "POST",
            endpoint: "/api/energy-meter",
            description: "Menyimpan data energy meter"
          }
        ]
      });
    }

    // =========================================================
    // GET /api/sensor-data
    // =========================================================
    if (
      request.method === "GET" &&
      url.pathname === "/api/sensor-data"
    ) {
      try {
        const result = await env.db_hvac.prepare(`
          SELECT
            id,
            device_id,
            temperature,
            humidity,
            co2,
            recorded_at
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

    // =========================================================
    // GET /api/sensor-data/{id}
    // =========================================================
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

        const result = await env.db_hvac.prepare(`
          SELECT
            id,
            device_id,
            temperature,
            humidity,
            co2,
            recorded_at
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

    // =========================================================
    // POST /api/sensor-data
    // =========================================================
    if (
      request.method === "POST" &&
      url.pathname === "/api/sensor-data"
    ) {
      try {
        const body = await request.json();

        const {
          device_id,
          temperature,
          humidity,
          co2
        } = body;

        if (!device_id) {
          return jsonResponse({
            success: false,
            message: "device_id wajib diisi"
          }, 400);
        }

        if (temperature === undefined || temperature === null) {
          return jsonResponse({
            success: false,
            message: "temperature wajib diisi"
          }, 400);
        }

        if (humidity === undefined || humidity === null) {
          return jsonResponse({
            success: false,
            message: "humidity wajib diisi"
          }, 400);
        }

        if (co2 === undefined || co2 === null) {
          return jsonResponse({
            success: false,
            message: "co2 wajib diisi"
          }, 400);
        }

        const result = await env.db_hvac.prepare(`
          INSERT INTO sensor_data
            (
              device_id,
              temperature,
              humidity,
              co2
            )
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

    // =========================================================
    // GET /api/energy-meter
    // =========================================================
    if (
      request.method === "GET" &&
      url.pathname === "/api/energy-meter"
    ) {
      try {
        const result = await env.db_em.prepare(`
          SELECT
            id,
            device_id,
            ts,
            voltage,
            current,
            power,
            energy_kwh
          FROM "ENERGY_METER_01CL1"
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
          message: "Gagal mengambil data energy meter",
          error: error.message
        }, 500);
      }
    }

    // =========================================================
    // GET /api/energy-meter/{id}
    // =========================================================
    if (
      request.method === "GET" &&
      url.pathname.startsWith("/api/energy-meter/")
    ) {
      try {
        const id = url.pathname.split("/").pop();

        if (!/^\d+$/.test(id)) {
          return jsonResponse({
            success: false,
            message: "ID harus berupa angka"
          }, 400);
        }

        const result = await env.db_em.prepare(`
          SELECT
            id,
            device_id,
            ts,
            voltage,
            current,
            power,
            energy_kwh
          FROM "ENERGY_METER_01CL1"
          WHERE id = ?
        `).bind(id).first();

        if (!result) {
          return jsonResponse({
            success: false,
            message: "Data energy meter tidak ditemukan"
          }, 404);
        }

        return jsonResponse({
          success: true,
          data: result
        });

      } catch (error) {
        return jsonResponse({
          success: false,
          message: "Gagal mengambil data energy meter",
          error: error.message
        }, 500);
      }
    }

    // =========================================================
    // POST /api/energy-meter
    // =========================================================
 if (
  request.method === "POST" &&
  url.pathname === "/api/energy-meter"
) {
  try {
    const body = await request.json();

    const {
      device_id,
      voltage,
      current,
      power,
      energy_kwh
    } = body;

    if (!device_id) {
      return jsonResponse({
        success: false,
        message: "device_id wajib diisi"
      }, 400);
    }

    if (voltage === undefined || voltage === null) {
      return jsonResponse({
        success: false,
        message: "voltage wajib diisi"
      }, 400);
    }

    if (current === undefined || current === null) {
      return jsonResponse({
        success: false,
        message: "current wajib diisi"
      }, 400);
    }

    if (power === undefined || power === null) {
      return jsonResponse({
        success: false,
        message: "power wajib diisi"
      }, 400);
    }

    if (energy_kwh === undefined || energy_kwh === null) {
      return jsonResponse({
        success: false,
        message: "energy_kwh wajib diisi"
      }, 400);
    }

    const voltageValue = Number(voltage);
    const currentValue = Number(current);
    const powerValue = Number(power);
    const energyValue = Number(energy_kwh);

    if (
      !Number.isFinite(voltageValue) ||
      !Number.isFinite(currentValue) ||
      !Number.isFinite(powerValue) ||
      !Number.isFinite(energyValue)
    ) {
      return jsonResponse({
        success: false,
        message: "voltage, current, power, dan energy_kwh harus berupa angka"
      }, 400);
    }

    const result = await env.ENERGY_DB.prepare(`
      INSERT INTO "ENERGY_METER_01CL1"
      (
        device_id,
        ts,
        voltage,
        current,
        power,
        energy_kwh
      )
      VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
    `).bind(
      device_id,
      voltageValue,
      currentValue,
      powerValue,
      energyValue
    ).run();

    return jsonResponse({
      success: true,
      message: "Data energy meter berhasil disimpan",
      data: {
        id: result.meta.last_row_id,
        device_id,
        voltage: voltageValue,
        current: currentValue,
        power: powerValue,
        energy_kwh: energyValue
      }
    }, 201);

  } catch (error) {
    return jsonResponse({
      success: false,
      message: "Gagal menyimpan data energy meter",
      error: error.message
    }, 500);
  }
}

    // =========================================================
    // Frontend static files
    // =========================================================
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    // =========================================================
    // 404
    // =========================================================
    return jsonResponse({
      success: false,
      message: "Endpoint tidak ditemukan",
      method: request.method,
      path: url.pathname
    }, 404);
  }
};
