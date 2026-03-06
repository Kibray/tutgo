import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendTelegramMessage(chatId: number, text: string, opts?: { reply_markup?: any }) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...opts,
    }),
  });
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

async function editMessageReplyMarkup(chatId: number, messageId: number) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();

    // Handle /start command
    if (update.message?.text?.startsWith("/start")) {
      const chatId = update.message.chat.id;
      const args = update.message.text.split(" ");
      const userId = args[1]; // /start <user_id>

      if (userId) {
        // Save telegram_chat_id to profiles
        const { error } = await supabase
          .from("profiles")
          .update({ telegram_chat_id: chatId })
          .eq("user_id", userId);

        if (!error) {
          await sendTelegramMessage(
            chatId,
            "✅ <b>Telegram подключён к TUTGO!</b>\n\nТеперь вы будете получать уведомления о записях, акциях и напоминания прямо сюда.\n\nДля отключения уведомлений перейдите в Настройки приложения."
          );
        } else {
          await sendTelegramMessage(
            chatId,
            "❌ Не удалось подключить аккаунт. Попробуйте ещё раз через приложение."
          );
        }
      } else {
        await sendTelegramMessage(
          chatId,
          "👋 Привет! Чтобы подключить уведомления, нажмите кнопку «Подключить Telegram» в приложении TUTGO."
        );
      }
    }

    // Handle callback queries (confirm/cancel appointment)
    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.message.chat.id;
      const messageId = update.callback_query.message.message_id;

      if (callbackData.startsWith("confirm_") || callbackData.startsWith("cancel_")) {
        const action = callbackData.startsWith("confirm_") ? "confirmed" : "cancelled";
        const appointmentId = callbackData.replace("confirm_", "").replace("cancel_", "");

        // Update appointment status
        const { data: appointment, error } = await supabase
          .from("appointments")
          .update({ status: action })
          .eq("id", appointmentId)
          .select("*, location_id")
          .single();

        if (!error && appointment) {
          // Remove inline buttons
          await editMessageReplyMarkup(chatId, messageId);

          const statusText = action === "confirmed" ? "✅ Запись подтверждена" : "❌ Запись отменена";
          await answerCallbackQuery(update.callback_query.id, statusText);

          // Send notification to client via telegram-notify
          // The DB trigger will handle in-app notification; we need to send Telegram to client
          if (appointment.client_user_id) {
            const { data: clientProfile } = await supabase
              .from("profiles")
              .select("telegram_chat_id")
              .eq("user_id", appointment.client_user_id)
              .single();

            if (clientProfile?.telegram_chat_id) {
              const { data: location } = await supabase
                .from("locations")
                .select("name, phone")
                .eq("id", appointment.location_id)
                .single();

              const dateStr = new Date(appointment.start_time).toLocaleString("ru-RU", {
                timeZone: "Asia/Tashkent",
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              });

              if (action === "confirmed") {
                await sendTelegramMessage(clientProfile.telegram_chat_id, 
                  `✅ <b>Ваша запись подтверждена!</b>\n📍 ${location?.name || ""}\n📅 ${dateStr}\n📞 ${location?.phone || "—"}`
                );
              } else {
                await sendTelegramMessage(clientProfile.telegram_chat_id,
                  `❌ <b>К сожалению ваша запись отменена</b>\n📍 ${location?.name || ""}\n📅 ${dateStr}\nПожалуйста запишитесь на другое время.`
                );
              }
            }
          }

          // Send confirmation message to business owner
          await sendTelegramMessage(chatId,
            `${statusText} ✔️`
          );
        } else {
          await answerCallbackQuery(update.callback_query.id, "Ошибка обновления записи");
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Telegram bot error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 200, // Always return 200 to Telegram
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
