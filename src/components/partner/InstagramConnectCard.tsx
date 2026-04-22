import { useEffect, useState } from "react";
import { Instagram, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SCOPES = [
  "instagram_basic",
  "instagram_manage_messages",
  "pages_messaging",
  "pages_show_list",
  "pages_manage_metadata",
  "business_management",
].join(",");

const InstagramConnectCard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [igId, setIgId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const redirectUri = `${window.location.origin}/instagram-callback`;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("instagram_connected, instagram_user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        setConnected(!!(data as any)?.instagram_connected);
        setIgId((data as any)?.instagram_user_id ?? null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleConnect = async () => {
    const appId = window.prompt(
      "Введите Meta App ID (можно найти в developers.facebook.com → ваш App → Settings → Basic):",
    );
    if (!appId) return;
    const state = crypto.randomUUID();
    sessionStorage.setItem("ig_oauth_state", state);
    const url =
      `https://www.facebook.com/v21.0/dialog/oauth` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&response_type=code` +
      `&state=${state}`;
    window.location.href = url;
  };

  const handleDisconnect = async () => {
    if (!user) return;
    if (!window.confirm("Отключить Instagram? Бот перестанет отвечать клиентам.")) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        instagram_connected: false,
        instagram_access_token: null,
        instagram_user_id: null,
        instagram_page_id: null,
      } as any)
      .eq("user_id", user.id);
    setBusy(false);
    if (error) {
      toast.error("Ошибка: " + error.message);
    } else {
      setConnected(false);
      setIgId(null);
      toast.success("Instagram отключён");
    }
  };

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 mb-4 border"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--accent) / 0.05))",
        borderColor: "hsl(var(--border))",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
          <Instagram className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Instagram AI-бот</h3>
            {connected && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {connected
              ? `Подключено: IG ID ${igId?.slice(0, 10)}… Бот отвечает клиентам автоматически.`
              : "AI отвечает клиентам в Direct и присылает ссылку на бронирование."}
          </p>
          <div className="mt-3">
            {connected ? (
              <button
                onClick={handleDisconnect}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-semibold active:scale-95 transition disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Отключить"}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold active:scale-95 transition"
              >
                Подключить Instagram
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InstagramConnectCard;
