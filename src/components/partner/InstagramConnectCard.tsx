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
      className="relative overflow-hidden rounded-2xl p-4 mb-4 border"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--accent) / 0.05))",
        borderColor: "hsl(var(--border))",
      }}
    >
      {/* Decorative right side: animated robot + Instagram on purple-pink gradient */}
      <div
        aria-hidden
        className="hidden sm:block pointer-events-none absolute top-0 right-0 h-full w-[44%] overflow-hidden"
        style={{
          background:
            "linear-gradient(120deg, rgba(236,72,153,0) 0%, rgba(236,72,153,0.18) 35%, rgba(168,85,247,0.35) 70%, rgba(99,102,241,0.4) 100%)",
          maskImage: "linear-gradient(to right, transparent 0%, black 30%, black 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 30%, black 100%)",
        }}
      >
        {/* Soft glowing orbs */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 140, height: 140, top: -40, right: -30,
            background: "radial-gradient(circle, rgba(236,72,153,0.55), transparent 70%)",
            filter: "blur(8px)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 110, height: 110, bottom: -30, right: 60,
            background: "radial-gradient(circle, rgba(168,85,247,0.55), transparent 70%)",
            filter: "blur(6px)",
          }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.6, 0.95, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating Instagram icon */}
        <motion.div
          className="absolute right-3 top-3 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            background: "linear-gradient(135deg, #f9ce34, #ee2a7b 50%, #6228d7)",
          }}
          animate={{ y: [0, -6, 0], rotate: [0, 6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Instagram className="w-5 h-5 text-white" />
        </motion.div>

        {/* Animated robot (emoji + CSS) */}
        <motion.div
          className="absolute"
          style={{ right: 70, bottom: 6, fontSize: 56, lineHeight: 1, filter: "drop-shadow(0 6px 12px rgba(98,40,215,0.45))" }}
          animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🤖
        </motion.div>

        {/* Tiny sparkle */}
        <motion.div
          className="absolute"
          style={{ right: 130, top: 30, fontSize: 14 }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          ✨
        </motion.div>
        <motion.div
          className="absolute"
          style={{ right: 40, bottom: 50, fontSize: 12 }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, delay: 0.6, repeat: Infinity, ease: "easeInOut" }}
        >
          ✨
        </motion.div>
      </div>

      <div className="relative flex items-start gap-3">
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
