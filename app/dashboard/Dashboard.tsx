"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Drink = {
  country: string;
  beer_servings: number;
  spirit_servings: number;
  wine_servings: number;
  total_litres_of_pure_alcohol: number;
};

type UploadMeta = {
  id: string;
  filename: string;
  row_count: number;
  uploaded_by: string;
  created_at: string;
};

const PIE_COLORS = ["#f59e0b", "#6366f1", "#ec4899"];

export default function Dashboard({ email }: { email: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [upload, setUpload] = useState<UploadMeta | null>(null);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      const data = await res.json();
      if (data.hasData) {
        setDrinks(data.drinks as Drink[]);
        setUpload(data.upload as UploadMeta);
        setHasData(true);
      } else {
        setHasData(false);
      }
    } catch {
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha no upload.");
        return;
      }
      await loadData();
    } catch {
      setError("Erro ao enviar o arquivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  function triggerUpload() {
    fileInputRef.current?.click();
  }

  // ---- Derived metrics ----
  const totalCountries = drinks.length;
  const avgLitres =
    totalCountries > 0
      ? drinks.reduce((s, d) => s + d.total_litres_of_pure_alcohol, 0) /
        totalCountries
      : 0;
  const topCountry = drinks[0]; // API returns sorted desc by total litres

  const totalBeer = drinks.reduce((s, d) => s + d.beer_servings, 0);
  const totalSpirit = drinks.reduce((s, d) => s + d.spirit_servings, 0);
  const totalWine = drinks.reduce((s, d) => s + d.wine_servings, 0);

  const top15 = drinks.slice(0, 15).map((d) => ({
    country: d.country,
    litros: d.total_litres_of_pure_alcohol,
  }));

  const pieData = [
    { name: "Cerveja", value: totalBeer },
    { name: "Destilados", value: totalSpirit },
    { name: "Vinho", value: totalWine },
  ];

  return (
    <>
      <div className="topbar">
        <span className="brand">🍺 Meu Sistema</span>
        <div>
          <span className="user">{email}</span>
          <button className="btn btn-ghost" onClick={handleLogout} type="button">
            Sair
          </button>
        </div>
      </div>

      <div className="container">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {error && <p className="error">{error}</p>}

        {loading ? (
          <p className="meta-line">Carregando...</p>
        ) : !hasData ? (
          <div className="upload-panel">
            <h2>Envie o arquivo de dados</h2>
            <p>
              Faça upload do <strong>drinks.csv</strong> para visualizar o
              consumo global de álcool.
            </p>
            <button
              className="btn"
              onClick={triggerUpload}
              disabled={uploading}
              type="button"
            >
              {uploading ? "Enviando..." : "Subir drinks.csv"}
            </button>
          </div>
        ) : (
          <>
            <div className="actions-row">
              <button
                className="btn"
                onClick={triggerUpload}
                disabled={uploading}
                type="button"
              >
                {uploading ? "Enviando..." : "Subir novo CSV"}
              </button>
              {upload && (
                <span className="meta-line" style={{ margin: 0 }}>
                  Último upload: <strong>{upload.filename}</strong> ·{" "}
                  {upload.row_count} países ·{" "}
                  {new Date(upload.created_at).toLocaleString("pt-BR")}
                </span>
              )}
            </div>

            <div className="cards">
              <div className="stat-card">
                <div className="label">Países</div>
                <div className="value">{totalCountries}</div>
              </div>
              <div className="stat-card">
                <div className="label">Média de litros de álcool puro</div>
                <div className="value">{avgLitres.toFixed(1)} L</div>
              </div>
              <div className="stat-card">
                <div className="label">Maior consumo</div>
                <div className="value" style={{ fontSize: 18 }}>
                  {topCountry?.country}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                    {" "}
                    ({topCountry?.total_litres_of_pure_alcohol} L)
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <div className="label">Total de doses (todas as bebidas)</div>
                <div className="value">
                  {(totalBeer + totalSpirit + totalWine).toLocaleString(
                    "pt-BR"
                  )}
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h3>Top 15 países — litros de álcool puro per capita</h3>
              <ResponsiveContainer width="100%" height={420}>
                <BarChart
                  data={top15}
                  layout="vertical"
                  margin={{ left: 40, right: 20, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis
                    type="category"
                    dataKey="country"
                    stroke="#94a3b8"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="litros" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-grid">
              <div className="chart-card">
                <h3>Distribuição global por tipo de bebida (doses)</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={(entry) =>
                        `${entry.name}: ${(
                          (entry.value /
                            (totalBeer + totalSpirit + totalWine)) *
                          100
                        ).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                        color: "#e2e8f0",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Dados por país</h3>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>País</th>
                        <th>Cerveja</th>
                        <th>Destilados</th>
                        <th>Vinho</th>
                        <th>Litros álcool</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drinks.map((d) => (
                        <tr key={d.country}>
                          <td>{d.country}</td>
                          <td>{d.beer_servings}</td>
                          <td>{d.spirit_servings}</td>
                          <td>{d.wine_servings}</td>
                          <td>{d.total_litres_of_pure_alcohol}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
