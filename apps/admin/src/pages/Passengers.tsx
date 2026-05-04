import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api.ts";
import { useEffect } from "react";

type Passenger = {
  id: string;
  name: string;
  phone: string;
  gsm?: string;
  email?: string;
  totalRides: number;
  rating: number;
};

export default function Passengers() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const [data, setData] = useState<Passenger[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get<{ passengers: Passenger[] }>("/passengers");
        if (!cancelled) setData(Array.isArray(res.data?.passengers) ? res.data.passengers : []);
      } catch (error) {
        console.error("Passengers load error:", error);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (!search) return true;
      return (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search) ||
        String(p.gsm ?? "").includes(search) ||
        String(p.email ?? "").includes(search)
      );
    });
  }, [search, data]);

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-page">{isEn ? "Passengers" : "Yolcular"}</h1>

          <div className="mt-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f5b700]" />
            <p className="t-desc">
              {isEn
                ? "Analyze passenger accounts, review past trips, and manage user behavior."
                : "Yolcu hesaplarını analiz edin, geçmiş yolculukları inceleyin ve kullanıcı davranışlarını yönetin."}
            </p>
          </div>
        </div>

        
      </div>

      {/* SEARCH */}
      <div className="max-w-md">
        <div className="flex items-center bg-[#111] border border-[#2a2a2a] px-4 py-3 rounded-2xl">
          <Search size={18} className="text-[#777]" />
          <input
            placeholder={isEn ? "Search passenger..." : "Yolcu ara..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white ml-3 w-full"
          />
        </div>
      </div>

      {/* GRID */}
      {/* EKLENDİ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {filtered.map((p) => {
          const initials = p.name
            .split(" ")
            .map((n) => n[0])
            .join("");

          return (
            <div
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`
                relative
                rounded-[26px]
                p-px
                bg-linear-to-b from-[#2a2a2a] to-[#0f0f0f]
                hover:from-[#f5b700]/40

                card-premium
                card-glow
                cursor-pointer

                ${selected === p.id ? "card-selected" : ""}
              `}
            >
              {/* INNER */}
              <div className="
                bg-[#0b0b0b]
                rounded-[26px]
                p-5
                h-full
                flex flex-col
                justify-between
                shadow-[0_10px_40px_rgba(0,0,0,0.8)]
              ">

                {/* TOP */}
                <div className="flex items-center gap-3 mb-4">

                  <div className="
                    w-12 h-12
                    rounded-full
                    bg-linear-to-br from-[#f5b700] to-[#ffde59]
                    text-black
                    font-bold
                    flex items-center justify-center
                    shadow-[0_0_15px_rgba(245,183,0,0.4)]
                  ">
                    {initials}
                  </div>

                  <div>
                    <p className="t-title">
                      {p.name}
                    </p>

                    <p className="t-desc">
                      {p.gsm || p.phone}
                    </p>
                    <p className="t-desc">
                      {p.email || "Mail: -"}
                    </p>
                  </div>
                </div>

                {/* MID */}
                <div className="grid grid-cols-2 gap-4 mb-4">

                  <div>
                    <p className="t-label">{isEn ? "Total Trips" : "Toplam Yolculuk"}</p>
                    <p className="stat-value">{p.totalRides}</p>
                  </div>

                  <div className="text-right">
                    <p className="t-label">{isEn ? "Rating" : "Puan"}</p>

                    <p className="flex items-center justify-end gap-1 stat-value text-[#f5b700]">
                     <span className="text-yellow-400 font-bold">{p.rating}</span>
                    <Star size={14} className="fill-[#f5b700]" />
                    </p>
                  </div>

                </div>

                {/* FOOTER */}
                <div className="flex justify-between items-center pt-3 border-t border-[#1f1f1f]">

                  <span className="t-meta">
                    Mar 2026
                  </span>

                  <span className="t-meta text-[#f5b700] font-semibold">
                    ID #{p.id}
                  </span>

                </div>

              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}