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
  try {
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
  } catch (e) {
    console.error("Failed to send telegram message");
  }
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch (e) {
    console.error("Failed to answer callback query");
  }
}

async function editMessageReplyMarkup(chatId: number, messageId: number) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }),
    });
  } catch (e) {
    console.error("Failed to edit message markup");
  }
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Handle 6-digit link code from user
async function handleLinkCode(chatId: number, code: string, username: string | null) {
  // Find valid link code
  const { data: linkCode, error } = await supabase
    .from("telegram_link_codes")
    .select("*")
    .eq("code", code)
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .limit(1)
    .single();

  if (error || !linkCode) {
    await sendTelegramMessage(chatId, "❌ Код не найден или истёк. Получите новый код в приложении TutGo.");
    return;
  }

  // Update profile with chat_id and username
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      telegram_chat_id: chatId,
      telegram_username: username || undefined,
    })
    .eq("user_id", linkCode.user_id);

  if (updateError) {
    await sendTelegramMessage(chatId, "❌ Не удалось привязать аккаунт. Попробуйте ещё раз.");
    return;
  }

  // Mark code as used
  await supabase
    .from("telegram_link_codes")
    .update({ used: true })
    .eq("id", linkCode.id);

  await sendTelegramMessage(
    chatId,
    "✅ <b>Telegram привязан к TutGo!</b>\n\nТеперь вы будете получать уведомления от TutGo 🎉\n\n📅 Подтверждения записей\n⏰ Напоминания за 1 час\n🎁 Акции и скидки"
  );
}

const TELEGRAM_SECRET_TOKEN = Deno.env.get("TELEGRAM_SECRET_TOKEN");
// Check if secret token contains only valid chars for Telegram
const SECRET_TOKEN_VALID = TELEGRAM_SECRET_TOKEN ? /^[A-Za-z0-9_-]{1,256}$/.test(TELEGRAM_SECRET_TOKEN) : false;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only validate secret token if it's properly configured with valid characters
  if (SECRET_TOKEN_VALID) {
    const headerToken = req.headers.get("x-telegram-bot-api-secret-token");
    if (headerToken !== TELEGRAM_SECRET_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const update = await req.json();

    // Handle regular text messages (check for 6-digit code)
    if (update.message?.text && !update.message.text.startsWith("/")) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id;
      
      // Check if it's a 6-digit code
      if (/^\d{6}$/.test(text)) {
        await handleLinkCode(chatId, text, update.message.from?.username || null);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle /start command
    if (update.message?.text?.startsWith("/start")) {
      const chatId = update.message.chat.id;
      const args = update.message.text.split(" ");
      const param = args[1];

      // Auth flow: /start auth
      if (param === "auth") {
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        await supabase
          .from("telegram_auth_codes")
          .delete()
          .eq("telegram_chat_id", chatId);

        await supabase.from("telegram_auth_codes").insert({
          code,
          telegram_chat_id: chatId,
          telegram_username: update.message.from?.username || null,
          telegram_first_name: update.message.from?.first_name || null,
          expires_at: expiresAt,
        });

        await sendTelegramMessage(
          chatId,
          `🔐 <b>Ваш код для входа в TUTGO:</b>\n\n<code>${code}</code>\n\nВведите этот код на сайте. Код действителен 5 минут.`
        );
      } else if (param && /^[0-9a-f-]{36}$/i.test(param)) {
        // Profile linking flow: /start <user_id> — validate UUID format
        const userId = param;
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
          "👋 <b>Привет! Я бот TutGo.</b>\n\nЧтобы привязать Telegram:\n1️⃣ Откройте tutgo.uz → Профиль\n2️⃣ Нажмите «Подключить Telegram»\n3️⃣ Получите 6-значный код\n4️⃣ Отправьте код мне сюда\n\n✅ После привязки вы будете получать уведомления о записях!"
        );
      }
    }

    // Handle callback queries
    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.message.chat.id;
      const messageId = update.callback_query.message.message_id;

      // ---- Partner approve/reject ----
      if (callbackData.startsWith("approve_partner_") || callbackData.startsWith("reject_partner_")) {
        const isApprove = callbackData.startsWith("approve_partner_");
        const appId = callbackData.replace("approve_partner_", "").replace("reject_partner_", "");

        if (!/^[0-9a-f-]{36}$/i.test(appId)) {
          await answerCallbackQuery(update.callback_query.id, "Ошибка");
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const newStatus = isApprove ? "approved" : "rejected";

        const { data: app, error } = await supabase
          .from("partner_applications")
          .update({ status: newStatus })
          .eq("id", appId)
          .select("*")
          .single();

        if (!error && app) {
          await editMessageReplyMarkup(chatId, messageId);

          if (isApprove) {
            const { data: locations } = await supabase
              .from("locations")
              .select("id, slug")
              .eq("owner_id", app.user_id)
              .eq("name", app.company_name);

            if (locations && locations.length > 0) {
              await supabase
                .from("locations")
                .update({ verified: true })
                .eq("id", locations[0].id);
            }

            const { data: partnerProfile } = await supabase
              .from("profiles")
              .select("telegram_chat_id")
              .eq("user_id", app.user_id)
              .single();

            if (partnerProfile?.telegram_chat_id) {
              const slug = locations?.[0]?.slug || '';
              await sendTelegramMessage(partnerProfile.telegram_chat_id,
                `🎉 <b>Ваша компания подтверждена на TutGo!</b>\n\n🏢 ${app.company_name}${slug ? `\n🌐 tutgo.uz/b/${slug}` : ''}`
              );
            }

            await supabase.from("notifications").insert({
              user_id: app.user_id,
              title: "🎉 Компания подтверждена!",
              body: `Ваша компания "${app.company_name}" подтверждена на TutGo!`,
              type: "info",
            });

            await answerCallbackQuery(update.callback_query.id, "✅ Одобрено");
            await sendTelegramMessage(chatId, `✅ Партнёр <b>${app.company_name}</b> одобрен`);
          } else {
            const { data: partnerProfile } = await supabase
              .from("profiles")
              .select("telegram_chat_id")
              .eq("user_id", app.user_id)
              .single();

            if (partnerProfile?.telegram_chat_id) {
              await sendTelegramMessage(partnerProfile.telegram_chat_id,
                `❌ <b>К сожалению ваша заявка не прошла проверку.</b>\n\nНапишите нам: info@tutgo.uz`
              );
            }

            await supabase.from("notifications").insert({
              user_id: app.user_id,
              title: "❌ Заявка отклонена",
              body: "К сожалению ваша заявка не прошла проверку. Напишите нам: info@tutgo.uz",
              type: "info",
            });

            await answerCallbackQuery(update.callback_query.id, "❌ Заблокировано");
            await sendTelegramMessage(chatId, `❌ Партнёр <b>${app.company_name}</b> заблокирован`);
          }
        } else {
          await answerCallbackQuery(update.callback_query.id, "Ошибка обновления");
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ---- Appointment confirm/cancel ----
      if (callbackData.startsWith("confirm_") || callbackData.startsWith("cancel_")) {
        const action = callbackData.startsWith("confirm_") ? "confirmed" : "cancelled";
        const appointmentId = callbackData.replace("confirm_", "").replace("cancel_", "");

        if (!/^[0-9a-f-]{36}$/i.test(appointmentId)) {
          await answerCallbackQuery(update.callback_query.id, "Ошибка");
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: appointment, error } = await supabase
          .from("appointments")
          .update({ status: action })
          .eq("id", appointmentId)
          .select("*, location_id")
          .single();

        if (!error && appointment) {
          await editMessageReplyMarkup(chatId, messageId);

          const statusText = action === "confirmed" ? "✅ Запись подтверждена" : "❌ Запись отменена";
          await answerCallbackQuery(update.callback_query.id, statusText);

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

          await sendTelegramMessage(chatId, `${statusText} ✔️`);
        } else {
          await answerCallbackQuery(update.callback_query.id, "Ошибка обновления записи");
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Telegram bot error");
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
