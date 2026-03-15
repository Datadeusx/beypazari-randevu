import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { calculateSMSCost } from "@/lib/sms/providers/netgsm";
import RetryButton from "./RetryButton";

interface SMSUsage {
  salon_id: string;
  sms_sent: number;
  sms_limit: number;
  month_year: string;
  salons: {
    name: string;
    slug: string;
  };
}

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
  salon_id: string | null;
  salons: {
    name: string;
    slug: string;
  } | null;
}

function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default async function AdminSMSPage() {
  const supabase = await createClient();

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  const currentMonth = getCurrentMonthYear();

  // Get all salon SMS usage for current month
  const { data: usageData } = await supabase
    .from("sms_usage")
    .select(
      `
      salon_id,
      sms_sent,
      sms_limit,
      month_year,
      salons ( name, slug )
    `
    )
    .eq("month_year", currentMonth)
    .order("sms_sent", { ascending: false });

  const usages = (usageData || []) as unknown as SMSUsage[];

  // Get failed SMS logs (last 100)
  const { data: failedLogs } = await supabase
    .from("sms_logs")
    .select(
      `
      id,
      phone,
      message,
      status,
      delivery_status,
      attempts,
      error_message,
      provider_message_id,
      created_at,
      salon_id,
      salons ( name, slug )
    `
    )
    .eq("delivery_status", "failed")
    .order("created_at", { ascending: false })
    .limit(100);

  const failed = (failedLogs || []) as unknown as SMSLog[];

  // Get recent SMS logs (last 100)
  const { data: recentLogs } = await supabase
    .from("sms_logs")
    .select(
      `
      id,
      phone,
      message,
      status,
      delivery_status,
      attempts,
      error_message,
      provider_message_id,
      created_at,
      salon_id,
      salons ( name, slug )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const recent = (recentLogs || []) as unknown as SMSLog[];

  // Calculate total statistics
  const totalSent = usages.reduce((sum, u) => sum + u.sms_sent, 0);
  const totalLimit = usages.reduce((sum, u) => sum + u.sms_limit, 0);
  const totalCost = calculateSMSCost(totalSent);
  const failedCount = failed.length;

  // Get salons approaching quota limit (> 80%)
  const approachingLimit = usages.filter(
    (u) => (u.sms_sent / u.sms_limit) * 100 > 80
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SMS Monitoring - Admin</h1>
          <p className="text-gray-600 mt-2">
            Tum salonlarin SMS kullanimi ve gecmisi
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Toplam SMS</h3>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {totalSent}
            </div>
            <p className="text-xs text-gray-500 mt-1">{currentMonth} donemi</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Toplam Kota</h3>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {totalLimit}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {usages.length} aktif salon
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Toplam Maliyet</h3>
            <div className="text-2xl font-bold text-purple-600 mt-2">
              {totalCost.toFixed(2)} TL
            </div>
            <p className="text-xs text-gray-500 mt-1">0.15 TL/SMS</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Basarisiz SMS</h3>
            <div className="text-2xl font-bold text-red-600 mt-2">
              {failedCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">Son 100 kayit</p>
          </div>
        </div>

        {/* Salons Approaching Limit */}
        {approachingLimit.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">
              Kotaya Yaklasan Salonlar
            </h3>
            <div className="space-y-2">
              {approachingLimit.map((usage) => {
                const percentage = ((usage.sms_sent / usage.sms_limit) * 100).toFixed(1);
                return (
                  <div
                    key={usage.salon_id}
                    className="flex items-center justify-between bg-white rounded p-3"
                  >
                    <div>
                      <span className="font-medium">{usage.salons.name}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({usage.sms_sent} / {usage.sms_limit})
                      </span>
                    </div>
                    <span className="text-yellow-700 font-semibold">
                      %{percentage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Salon Usage Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Salon Bazinda Kullanim
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Salon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gonderilen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kalan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kullanim %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Maliyet
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Henuz SMS kullanimi yok
                    </td>
                  </tr>
                ) : (
                  usages.map((usage) => {
                    const remaining = usage.sms_limit - usage.sms_sent;
                    const percentage = ((usage.sms_sent / usage.sms_limit) * 100).toFixed(1);
                    const cost = calculateSMSCost(usage.sms_sent);

                    return (
                      <tr key={usage.salon_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {usage.salons.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {usage.sms_sent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {usage.sms_limit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {remaining}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              parseFloat(percentage) > 90
                                ? "bg-red-100 text-red-800"
                                : parseFloat(percentage) > 70
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            %{percentage}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cost.toFixed(2)} TL
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Failed SMS Logs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Basarisiz SMS Gonderimler
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Son 100 basarisiz SMS
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Salon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deneme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hata
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Islem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {failed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Basarisiz SMS yok
                    </td>
                  </tr>
                ) : (
                  failed.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.salons?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.attempts}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                        {log.error_message || "Bilinmeyen hata"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <RetryButton logId={log.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent SMS Logs */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Son SMS Gonderimler
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Son 100 SMS kaydı
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Salon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mesaj
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deneme
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Henuz SMS gonderilmedi
                    </td>
                  </tr>
                ) : (
                  recent.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.salons?.name || "N/A"}
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
                          {log.delivery_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.attempts}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
