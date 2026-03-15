import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSMSUsageStats } from "@/lib/sms/quota";
import { calculateSMSCost } from "@/lib/sms/providers/netgsm";

interface SMSLog {
  id: string;
  phone: string;
  message: string;
  status: string;
  delivery_status: string;
  attempts: number;
  error_message: string | null;
  provider_message_id: string | null;
  created_at: string;
  delivered_at: string | null;
}

export default async function SMSUsagePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get salon by slug
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, slug")
    .eq("slug", params.slug)
    .eq("owner_id", user.id)
    .single();

  if (!salon) {
    redirect("/panel");
  }

  // Get SMS usage statistics
  const usageStats = await getSMSUsageStats(salon.id);

  // Get recent SMS logs
  const { data: smsLogs } = await supabase
    .from("sms_logs")
    .select("*")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const logs = (smsLogs || []) as SMSLog[];

  // Calculate cost
  const totalCost = calculateSMSCost(usageStats.sent);

  // Calculate statistics
  const deliveredCount = logs.filter((log) => log.delivery_status === "delivered").length;
  const failedCount = logs.filter((log) => log.delivery_status === "failed").length;
  const deliveryRate = usageStats.sent > 0 ? ((deliveredCount / usageStats.sent) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SMS Kullanimi</h1>
          <p className="text-gray-600 mt-2">{salon.name}</p>
        </div>

        {/* Usage Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Quota Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Aylik Kota</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {usageStats.sent} / {usageStats.limit}
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    usageStats.percentage > 90
                      ? "bg-red-600"
                      : usageStats.percentage > 70
                      ? "bg-yellow-500"
                      : "bg-green-600"
                  }`}
                  style={{ width: `${Math.min(usageStats.percentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                %{usageStats.percentage} kullanildi
              </p>
            </div>
          </div>

          {/* Remaining Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Kalan SMS</h3>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {usageStats.remaining}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {usageStats.monthYear} donemi
            </p>
          </div>

          {/* Cost Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Toplam Maliyet</h3>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {totalCost.toFixed(2)} TL
            </div>
            <p className="text-xs text-gray-500 mt-2">
              0.15 TL/SMS
            </p>
          </div>

          {/* Delivery Rate Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Teslimat Orani</h3>
            </div>
            <div className="text-2xl font-bold text-green-600">
              %{deliveryRate}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {deliveredCount} / {usageStats.sent} teslim edildi
            </p>
          </div>
        </div>

        {/* SMS Logs Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">SMS Gecmisi</h2>
            <p className="text-sm text-gray-600 mt-1">
              Son 50 SMS kaydı
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesaj
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deneme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hata
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Henuz SMS gonderilmedi
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.delivery_status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : log.delivery_status === "sent"
                              ? "bg-blue-100 text-blue-800"
                              : log.delivery_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : log.delivery_status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {log.delivery_status === "delivered"
                            ? "Teslim Edildi"
                            : log.delivery_status === "sent"
                            ? "Gonderildi"
                            : log.delivery_status === "pending"
                            ? "Beklemede"
                            : log.delivery_status === "failed"
                            ? "Basarisiz"
                            : "Bilinmiyor"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.attempts}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                        {log.error_message || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            SMS Sistemi Hakkinda
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Aylik SMS kotaniz: {usageStats.limit} SMS</li>
            <li>• SMS basina maliyet: 0.15 TL</li>
            <li>• Basarisiz SMS gonderimlerinde otomatik 3 deneme yapilir</li>
            <li>• Randevu hatirlatmalari otomatik olarak 1 gun once gonderilir</li>
            <li>• Kotaniz dolmadan once sistem yoneticinizle iletisime gecin</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
