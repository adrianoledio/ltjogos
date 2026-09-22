// server/app.ts
import express from "express";
import { createClient as createClient3 } from "@supabase/supabase-js";

// server/lib/sendDepositEmail.ts
import nodemailer from "nodemailer";
async function sendDepositNotificationEmail(data) {
  const recipient = "lediotattoo@proton.me";
  const { amount, bonus = 0, userPhone, userName, userEmail, transactionId, settings } = data;
  const subject = `\u{1F4B0} Dep\xF3sito Aprovado: R$ ${Number(amount).toFixed(2)} - Tel: ${userPhone || "Sem Telefone"}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #111827; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #374151;">
      <h2 style="color: #10B981; margin-top: 0; font-size: 22px;">\u{1F4B0} Novo Dep\xF3sito Aprovado!</h2>
      <p style="color: #9CA3AF; font-size: 14px;">Um dep\xF3sito foi processado e aprovado com sucesso na plataforma LT JOGOS.</p>
      
      <div style="background-color: #1F2937; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; color: #E5E7EB; font-size: 14px;">
          <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">Valor do Dep\xF3sito:</td>
            <td style="padding: 10px 0; color: #10B981; font-size: 20px; font-weight: bold; text-align: right;">
              R$ ${Number(amount).toFixed(2)} ${bonus ? `<span style="font-size: 12px; color: #F59E0B;">(+ R$ ${Number(bonus).toFixed(2)} B\xF4nus)</span>` : ""}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">Telefone do Usu\xE1rio:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #60A5FA; font-size: 16px; text-align: right;">
              ${userPhone || "N\xE3o informado"}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">Nome do Usu\xE1rio:</td>
            <td style="padding: 10px 0; text-align: right;">${userName || "Usu\xE1rio"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">Email do Usu\xE1rio:</td>
            <td style="padding: 10px 0; text-align: right;">${userEmail || "N/A"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">ID da Transa\xE7\xE3o:</td>
            <td style="padding: 10px 0; font-family: monospace; text-align: right;">${transactionId || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">Data / Hora:</td>
            <td style="padding: 10px 0; text-align: right;">${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
          </tr>
        </table>
      </div>
      <p style="color: #6B7280; font-size: 12px; text-align: center; margin-bottom: 0;">Notifica\xE7\xE3o Autom\xE1tica - Plataforma LT JOGOS</p>
    </div>
  `;
  const resendApiKey = process.env.RESEND_API_KEY || settings?.resendApiKey;
  if (resendApiKey) {
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: settings?.emailFrom || "LT JOGOS <onboarding@resend.dev>",
          to: [recipient],
          subject,
          html: htmlContent
        })
      });
      if (resendRes.ok) {
        console.log("Deposit notification email sent via Resend API to", recipient);
        return true;
      } else {
        console.warn("Resend API response:", await resendRes.text());
      }
    } catch (e) {
      console.warn("Resend email attempt failed:", e);
    }
  }
  const smtpHost = process.env.SMTP_HOST || settings?.smtpHost;
  const smtpPort = Number(process.env.SMTP_PORT || settings?.smtpPort || 587);
  const smtpUser = process.env.SMTP_USER || settings?.smtpUser;
  const smtpPass = process.env.SMTP_PASS || settings?.smtpPass;
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
      await transporter.sendMail({
        from: settings?.emailFrom || `"LT JOGOS" <${smtpUser}>`,
        to: recipient,
        subject,
        html: htmlContent
      });
      console.log("Deposit notification email sent via SMTP to", recipient);
      return true;
    } catch (smtpErr) {
      console.warn("SMTP email notification failed:", smtpErr);
    }
  }
  return false;
}

// server/services/checkStatus.ts
import { createClient } from "@supabase/supabase-js";
function getSupabaseEnv() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://mtodxdlvpsldxwtvtttk.supabase.co";
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10b2R4ZGx2cHNsZHh3dHZ0dHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTg5NjUsImV4cCI6MjEwNTU5NDk2NX0.By1JUfX28vpMSZS1fbItofVcq3X5MoFeT2m_QDhxH_E";
  return { url, key };
}
async function approvePendingTx(supabase3, tx, settings) {
  if (tx.status === "completed") return true;
  const metadata = tx.metadata ? typeof tx.metadata === "string" ? JSON.parse(tx.metadata) : tx.metadata : {};
  const bonus = Number(metadata?.bonus || 0);
  const totalAdd = Number(tx.amount) + bonus;
  await supabase3.from("transactions").update({ status: "completed" }).eq("id", tx.id);
  const { data: user } = await supabase3.from("users").select("id, balance, phone, name, email, referredBy, referralCounted").eq("id", tx.userId).maybeSingle();
  if (user) {
    const newBalance = (Number(user.balance) || 0) + totalAdd;
    await supabase3.from("users").update({ balance: newBalance }).eq("id", user.id);
    if (user.referredBy && !user.referralCounted) {
      const { data: referrer } = await supabase3.from("users").select("id, referrals, unlockFirstWithdrawal").eq("id", user.referredBy).maybeSingle();
      if (referrer) {
        const newReferrals = (referrer.referrals || 0) + 1;
        let unlockFirstWithdrawal = referrer.unlockFirstWithdrawal;
        if (newReferrals >= (settings?.referralsForFirstWithdrawal || 3)) {
          unlockFirstWithdrawal = true;
        }
        await supabase3.from("users").update({ referrals: newReferrals, unlockFirstWithdrawal }).eq("id", referrer.id);
        await supabase3.from("users").update({ referralCounted: true }).eq("id", user.id);
      }
    }
    try {
      await sendDepositNotificationEmail({
        amount: Number(tx.amount),
        bonus,
        userPhone: user.phone,
        userName: user.name,
        userEmail: user.email,
        transactionId: tx.id,
        settings
      });
    } catch (emailErr) {
      console.warn("Could not send deposit email notification:", emailErr);
    }
    return true;
  }
  return false;
}
async function syncAllPendingDeposits() {
  const { url: supabaseUrl2, key: supabaseKey2 } = getSupabaseEnv();
  if (!supabaseUrl2 || !supabaseKey2) {
    return { approvedCount: 0, error: "Supabase not configured" };
  }
  const supabase3 = createClient(supabaseUrl2.startsWith("http") ? supabaseUrl2 : `https://${supabaseUrl2}`, supabaseKey2);
  const { data: settingsData } = await supabase3.from("settings").select("data").eq("id", "global").maybeSingle();
  const settings = settingsData?.data ? typeof settingsData.data === "string" ? JSON.parse(settingsData.data) : settingsData.data : null;
  const { data: pendingTxs } = await supabase3.from("transactions").select("*").eq("type", "deposit").eq("status", "pending");
  if (!pendingTxs || pendingTxs.length === 0) {
    return { approvedCount: 0, message: "No pending transactions" };
  }
  let approvedCount = 0;
  for (const tx of pendingTxs) {
    const meta = tx.metadata ? typeof tx.metadata === "string" ? JSON.parse(tx.metadata) : tx.metadata : {};
    const pixupTxId = meta.pixupTransactionId || meta.transactionId;
    if (meta.status === "PAID" || meta.status === "COMPLETED" || meta.approved) {
      const ok = await approvePendingTx(supabase3, tx, settings);
      if (ok) approvedCount++;
    }
  }
  return { approvedCount, totalPending: pendingTxs.length };
}
async function verifyAndApprovePayment(paymentId, txId, userId) {
  await syncAllPendingDeposits().catch((e) => console.warn("syncAllPendingDeposits error:", e));
  const { url: supabaseUrl2, key: supabaseKey2 } = getSupabaseEnv();
  if (!supabaseUrl2 || !supabaseKey2) {
    return { approved: false, reason: "Supabase not configured" };
  }
  const supabase3 = createClient(supabaseUrl2.startsWith("http") ? supabaseUrl2 : `https://${supabaseUrl2}`, supabaseKey2);
  const { data: settingsData } = await supabase3.from("settings").select("data").eq("id", "global").maybeSingle();
  const settings = settingsData?.data ? typeof settingsData.data === "string" ? JSON.parse(settingsData.data) : settingsData.data : null;
  let query = supabase3.from("transactions").select("*").eq("type", "deposit");
  if (txId) {
    query = query.eq("id", txId);
  } else if (userId) {
    query = query.eq("userId", userId).order("date", { ascending: false }).limit(1);
  }
  const { data: txs } = await query;
  const targetTx = txs?.[0];
  if (!targetTx) {
    return { approved: false, reason: "Transaction not found" };
  }
  if (targetTx.status === "completed") {
    return { approved: true, transactionId: targetTx.id, amount: targetTx.amount };
  }
  return { approved: false, status: targetTx.status, transactionId: targetTx.id };
}

// src/lib/supabase.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var DEFAULT_SUPABASE_URL = "https://mtodxdlvpsldxwtvtttk.supabase.co";
var DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10b2R4ZGx2cHNsZHh3dHZ0dHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTg5NjUsImV4cCI6MjEwNTU5NDk2NX0.By1JUfX28vpMSZS1fbItofVcq3X5MoFeT2m_QDhxH_E";
function getValidSupabaseCredentials() {
  let url = "";
  let key = "";
  if (typeof process !== "undefined" && process?.env) {
    url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  }
  if (!url || !key) {
    try {
      const meta = import.meta;
      if (meta && meta.env) {
        url = meta.env.VITE_SUPABASE_URL || "";
        key = meta.env.VITE_SUPABASE_ANON_KEY || "";
      }
    } catch (e) {
    }
  }
  if (!url || !key) {
    url = DEFAULT_SUPABASE_URL;
    key = DEFAULT_SUPABASE_ANON_KEY;
  }
  if (url && url.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(atob(url.split(".")[1]));
      if (payload && payload.ref) {
        url = `https://${payload.ref}.supabase.co`;
        console.log("Auto-recovered Supabase URL from JWT:", url);
      }
    } catch (e) {
      console.warn("Failed to decode JWT to recover Supabase URL");
    }
  }
  const isHttpUrl = url && (url.startsWith("http://") || url.startsWith("https://"));
  if (!isHttpUrl) {
    if (url) {
      console.warn("Invalid VITE_SUPABASE_URL format detected. Falling back to offline placeholder.");
    }
    url = "";
    key = "";
  }
  return { url, key };
}
var { url: supabaseUrl, key: supabaseKey } = getValidSupabaseCredentials();
var supabase = createClient2(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder"
);

// server/slotEngine.ts
var TATTOO_WEIGHTED_SYMBOLS = [
  "10",
  "10",
  "10",
  "10",
  "10",
  "J",
  "J",
  "J",
  "J",
  "Q",
  "Q",
  "Q",
  "Q",
  "K",
  "K",
  "K",
  "A",
  "A",
  "A",
  "NEEDLE",
  "NEEDLE",
  "BOOTS",
  "BOOTS",
  "INK",
  "INK",
  "MACHINE",
  "HEART",
  "WILD",
  "SCATTER"
];
var TATTOO_PAYTABLE = {
  HEART: [0, 0, 0, 2.5, 5, 12],
  MACHINE: [0, 0, 0, 2, 4, 8],
  INK: [0, 0, 0, 1.5, 3, 6],
  BOOTS: [0, 0, 0, 1.2, 2.5, 5],
  NEEDLE: [0, 0, 0, 1, 2, 4],
  A: [0, 0, 0, 0.6, 1.2, 2.5],
  K: [0, 0, 0, 0.5, 1, 2],
  Q: [0, 0, 0, 0.4, 0.8, 1.6],
  J: [0, 0, 0, 0.3, 0.6, 1.2],
  "10": [0, 0, 0, 0.2, 0.4, 0.8]
};
function computeTattooSlotOutcome(targetPrize, baseBet, freeSpinsActive, freeSpinsMultiplier, doubleChance) {
  const ROWS = 4;
  const COLS = 5;
  let finalGrid = [];
  if (targetPrize >= baseBet * 5) {
    const highSyms = ["HEART", "MACHINE", "INK"];
    const winSym = highSyms[Math.floor(Math.random() * highSyms.length)];
    finalGrid = Array.from(
      { length: ROWS },
      () => Array.from({ length: COLS }, () => TATTOO_WEIGHTED_SYMBOLS[Math.floor(Math.random() * TATTOO_WEIGHTED_SYMBOLS.length)])
    );
    for (let c = 0; c < 4; c++) {
      const r = Math.floor(Math.random() * ROWS);
      finalGrid[r][c] = winSym;
    }
    finalGrid[Math.floor(Math.random() * ROWS)][2] = "WILD";
    if (Math.random() < 0.2 || doubleChance) {
      finalGrid[Math.floor(Math.random() * ROWS)][0] = "SCATTER";
      finalGrid[Math.floor(Math.random() * ROWS)][4] = "SCATTER";
    }
  } else if (targetPrize > 0) {
    const letterSyms = ["A", "K", "Q", "J", "10"];
    const winSym = letterSyms[Math.floor(Math.random() * letterSyms.length)];
    const matchCount = Math.floor(Math.random() * 2) + 3;
    finalGrid = Array.from(
      { length: ROWS },
      () => Array.from({ length: COLS }, () => TATTOO_WEIGHTED_SYMBOLS[Math.floor(Math.random() * TATTOO_WEIGHTED_SYMBOLS.length)])
    );
    for (let c = 0; c < matchCount; c++) {
      const r = Math.floor(Math.random() * ROWS);
      finalGrid[r][c] = winSym;
    }
    if (matchCount < COLS) {
      for (let r = 0; r < ROWS; r++) {
        if (finalGrid[r][matchCount] === winSym || finalGrid[r][matchCount] === "WILD") {
          finalGrid[r][matchCount] = winSym === "A" ? "10" : "A";
        }
      }
    }
  } else {
    let attempts = 0;
    while (attempts < 10) {
      finalGrid = Array.from(
        { length: ROWS },
        () => Array.from({ length: COLS }, () => TATTOO_WEIGHTED_SYMBOLS[Math.floor(Math.random() * TATTOO_WEIGHTED_SYMBOLS.length)])
      );
      const col1Syms = finalGrid.map((row) => row[0]);
      const col2Syms = finalGrid.map((row) => row[1]);
      let hasPotential = false;
      finalGrid.forEach((row, rIdx) => {
        const sym = row[2];
        if (col1Syms.includes(sym) || col2Syms.includes(sym) || sym === "WILD") {
          hasPotential = true;
          finalGrid[rIdx][2] = "10";
        }
      });
      if (!hasPotential) break;
      attempts++;
    }
    if (Math.random() < 0.1 || doubleChance && Math.random() < 0.25) {
      finalGrid[Math.floor(Math.random() * ROWS)][0] = "SCATTER";
      finalGrid[Math.floor(Math.random() * ROWS)][2] = "SCATTER";
    }
  }
  let totalWin = 0;
  let winningPositions = [];
  let scatterCount = 0;
  finalGrid.forEach((row) => {
    row.forEach((sym) => {
      if (sym === "SCATTER") scatterCount++;
    });
  });
  Object.keys(TATTOO_PAYTABLE).forEach((symbol) => {
    let ways = 1;
    let matchCount = 0;
    let tempPositions = [];
    for (let c = 0; c < COLS; c++) {
      let countInCol = 0;
      let colPositions = [];
      for (let r = 0; r < ROWS; r++) {
        if (finalGrid[r][c] === symbol || finalGrid[r][c] === "WILD") {
          countInCol++;
          colPositions.push({ r, c });
        }
      }
      if (countInCol > 0) {
        ways *= countInCol;
        matchCount++;
        tempPositions.push(...colPositions);
      } else {
        break;
      }
    }
    if (matchCount >= 3) {
      const payoutMultiplier = TATTOO_PAYTABLE[symbol][matchCount];
      if (payoutMultiplier > 0) {
        const winMultiplier = freeSpinsActive ? freeSpinsMultiplier : 1;
        let cashWin = baseBet * payoutMultiplier * ways * winMultiplier;
        if (targetPrize > 0) {
          const remainingCap = targetPrize - totalWin;
          if (cashWin > remainingCap) {
            cashWin = Math.max(0, remainingCap);
          }
        }
        totalWin += cashWin;
        winningPositions.push(...tempPositions);
      }
    }
  });
  const freeSpinsWon = scatterCount >= 3 ? 10 + (scatterCount - 3) * 2 : 0;
  return {
    gameId: "tattoo-slot",
    targetPrize,
    finalGrid,
    totalWin: Math.round(totalWin * 100) / 100,
    winningPositions,
    scatterCount,
    freeSpinsWon
  };
}
var TIGER_SYMBOLS = [
  { id: "TIGER_HEAD", payout: 100 },
  { id: "TIGER_BODY", payout: 50 },
  { id: "TIGER_CLAWS", payout: 25 },
  { id: "GOLD_TIGER", payout: 10 },
  { id: "SILVER_TIGER", payout: 5 },
  { id: "TIGER_PAW", payout: 3 },
  { id: "KATANA", payout: 2 }
];
var DRAGON_SYMBOLS = [
  { id: "DRAGON_HEAD", payout: 100 },
  { id: "DRAGON_BODY", payout: 50 },
  { id: "DRAGON_CLAWS", payout: 25 },
  { id: "GOLD_DRAGON", payout: 10 },
  { id: "SILVER_DRAGON", payout: 5 },
  { id: "DRAGON_PAW", payout: 3 },
  { id: "KATANA", payout: 2 }
];
function computeYakuzaInkOutcome(targetPrize, betPerLine, tigerActive, dragonActive) {
  const makeLoseTiger = () => {
    const syms = [...TIGER_SYMBOLS];
    const list = [
      syms[Math.floor(Math.random() * syms.length)].id,
      syms[Math.floor(Math.random() * syms.length)].id,
      syms[Math.floor(Math.random() * syms.length)].id
    ];
    if (list[0] === list[1] && list[1] === list[2]) {
      list[0] = list[0] === "KATANA" ? "TIGER_PAW" : "KATANA";
    }
    return list;
  };
  const makeLoseDragon = () => {
    const syms = [...DRAGON_SYMBOLS];
    const list = [
      syms[Math.floor(Math.random() * syms.length)].id,
      syms[Math.floor(Math.random() * syms.length)].id,
      syms[Math.floor(Math.random() * syms.length)].id
    ];
    if (list[0] === list[1] && list[1] === list[2]) {
      list[0] = list[0] === "KATANA" ? "DRAGON_PAW" : "KATANA";
    }
    return list;
  };
  let tigerResult = [];
  let dragonResult = [];
  let calculatedTigerWin = 0;
  let calculatedDragonWin = 0;
  let winningTigerPos = [];
  let winningDragonPos = [];
  if (targetPrize > 0) {
    if (tigerActive && dragonActive) {
      const halfTarget = targetPrize / 2;
      let TigerPayout = 0;
      let DragonPayout = 0;
      const options = [100, 50, 25, 10, 5];
      const matchTig = options.find((o) => Math.abs(o * betPerLine - halfTarget / 2) < 0.1);
      const matchDrag = options.find((o) => Math.abs(o * betPerLine - halfTarget / 2) < 0.1);
      if (matchTig && matchDrag) {
        TigerPayout = matchTig * betPerLine;
        DragonPayout = matchDrag * betPerLine;
      } else {
        if (Math.random() > 0.5) {
          TigerPayout = targetPrize;
          DragonPayout = 0;
        } else {
          TigerPayout = 0;
          DragonPayout = targetPrize;
        }
      }
      if (TigerPayout > 0) {
        const mult = TigerPayout / betPerLine;
        const config = TIGER_SYMBOLS.find((s) => s.payout === mult);
        if (config) {
          tigerResult = [config.id, config.id, config.id];
          calculatedTigerWin = TigerPayout;
          winningTigerPos = [0, 1, 2];
        } else if (mult === 5) {
          tigerResult = ["GOLD_TIGER", "SILVER_TIGER", "TIGER_PAW"];
          calculatedTigerWin = TigerPayout;
          winningTigerPos = [0, 1, 2];
        } else {
          tigerResult = makeLoseTiger();
        }
      } else {
        tigerResult = makeLoseTiger();
      }
      if (DragonPayout > 0) {
        const mult = DragonPayout / betPerLine;
        const config = DRAGON_SYMBOLS.find((s) => s.payout === mult);
        if (config) {
          dragonResult = [config.id, config.id, config.id];
          calculatedDragonWin = DragonPayout;
          winningDragonPos = [0, 1, 2];
        } else if (mult === 5) {
          dragonResult = ["GOLD_DRAGON", "SILVER_DRAGON", "DRAGON_PAW"];
          calculatedDragonWin = DragonPayout;
          winningDragonPos = [0, 1, 2];
        } else {
          dragonResult = makeLoseDragon();
        }
      } else {
        dragonResult = makeLoseDragon();
      }
    } else if (tigerActive) {
      const mult = targetPrize / betPerLine;
      const config = TIGER_SYMBOLS.find((s) => s.payout === mult);
      if (config) {
        tigerResult = [config.id, config.id, config.id];
        calculatedTigerWin = targetPrize;
        winningTigerPos = [0, 1, 2];
      } else if (mult === 5) {
        tigerResult = ["GOLD_TIGER", "SILVER_TIGER", "TIGER_PAW"];
        calculatedTigerWin = targetPrize;
        winningTigerPos = [0, 1, 2];
      } else {
        tigerResult = makeLoseTiger();
      }
      dragonResult = makeLoseDragon();
    } else if (dragonActive) {
      const mult = targetPrize / betPerLine;
      const config = DRAGON_SYMBOLS.find((s) => s.payout === mult);
      if (config) {
        dragonResult = [config.id, config.id, config.id];
        calculatedDragonWin = targetPrize;
        winningDragonPos = [0, 1, 2];
      } else if (mult === 5) {
        dragonResult = ["GOLD_DRAGON", "SILVER_DRAGON", "DRAGON_PAW"];
        calculatedDragonWin = targetPrize;
        winningDragonPos = [0, 1, 2];
      } else {
        dragonResult = makeLoseDragon();
      }
      tigerResult = makeLoseTiger();
    }
  } else {
    if (tigerActive) {
      if (Math.random() < 0.12) {
        const possible = [...TIGER_SYMBOLS];
        const choice = possible[Math.floor(Math.random() * possible.length)];
        tigerResult = [choice.id, choice.id, choice.id];
        calculatedTigerWin = choice.payout * betPerLine;
        winningTigerPos = [0, 1, 2];
      } else if (Math.random() < 0.25) {
        tigerResult = ["GOLD_TIGER", "SILVER_TIGER", "TIGER_PAW"];
        calculatedTigerWin = 5 * betPerLine;
        winningTigerPos = [0, 1, 2];
      } else {
        tigerResult = makeLoseTiger();
      }
    } else {
      tigerResult = makeLoseTiger();
    }
    if (dragonActive) {
      if (Math.random() < 0.12) {
        const possible = [...DRAGON_SYMBOLS];
        const choice = possible[Math.floor(Math.random() * possible.length)];
        dragonResult = [choice.id, choice.id, choice.id];
        calculatedDragonWin = choice.payout * betPerLine;
        winningDragonPos = [0, 1, 2];
      } else if (Math.random() < 0.25) {
        dragonResult = ["GOLD_DRAGON", "SILVER_DRAGON", "DRAGON_PAW"];
        calculatedDragonWin = 5 * betPerLine;
        winningDragonPos = [0, 1, 2];
      } else {
        dragonResult = makeLoseDragon();
      }
    } else {
      dragonResult = makeLoseDragon();
    }
  }
  const bothActive = tigerActive && dragonActive;
  const isBothFullWin = winningTigerPos.length === 3 && winningDragonPos.length === 3;
  const isDoubleWin = bothActive && isBothFullWin;
  let totalWin = calculatedTigerWin + calculatedDragonWin;
  if (isDoubleWin) {
    totalWin *= 2;
  }
  return {
    gameId: "yakuza-ink",
    targetPrize,
    tigerResult,
    dragonResult,
    calculatedTigerWin,
    calculatedDragonWin,
    totalWin: Math.round(totalWin * 100) / 100,
    isDoubleWin,
    winningTigerPos,
    winningDragonPos
  };
}
var MYSTIC_WEIGHTED_SYMBOLS = [
  "10",
  "10",
  "10",
  "10",
  "9",
  "9",
  "9",
  "9",
  "J",
  "J",
  "J",
  "Q",
  "Q",
  "Q",
  "K",
  "K",
  "A",
  "A",
  "SCALES",
  "SCALES",
  "POTION",
  "WILD",
  "SCATTER"
];
var MYSTIC_PAYTABLE = {
  POTION: [0, 0, 0, 1, 2.5, 5],
  SCALES: [0, 0, 0, 0.8, 2, 4],
  A: [0, 0, 0, 0.5, 1.5, 3],
  K: [0, 0, 0, 0.4, 1.2, 2.5],
  Q: [0, 0, 0, 0.3, 1, 2],
  J: [0, 0, 0, 0.2, 0.8, 1.5],
  "10": [0, 0, 0, 0.1, 0.5, 1],
  "9": [0, 0, 0, 0.1, 0.5, 1]
};
var getRandomMultiplier = () => {
  const rand = Math.random();
  if (rand < 0.5) return 2;
  if (rand < 0.75) return 3;
  if (rand < 0.85) return 4;
  if (rand < 0.92) return 5;
  if (rand < 0.96) return 10;
  if (rand < 0.98) return 20;
  if (rand < 0.995) return 50;
  return 100;
};
function computeMysticInkOutcome(targetPrize, bet, freeSpins, freeSpinMultiplier, isWildTattoo) {
  const ROWS = 3;
  const COLS = 5;
  let finalGrid = [];
  if (targetPrize > 0) {
    const symbols = ["POTION", "SCALES", "A", "K", "Q", "J", "10", "9"];
    const winSymbol = targetPrize > bet * 10 ? "POTION" : symbols[Math.floor(Math.random() * symbols.length)];
    finalGrid = Array.from(
      { length: ROWS },
      () => Array.from({ length: COLS }, () => MYSTIC_WEIGHTED_SYMBOLS[Math.floor(Math.random() * MYSTIC_WEIGHTED_SYMBOLS.length)])
    );
    const matchCols = Math.min(5, Math.floor(Math.random() * 3) + 3);
    for (let c = 0; c < matchCols; c++) {
      const r = Math.floor(Math.random() * ROWS);
      finalGrid[r][c] = winSymbol;
    }
    if (Math.random() < 0.25) {
      finalGrid[Math.floor(Math.random() * ROWS)][2] = "WILD";
    }
    if (Math.random() < 0.1) {
      finalGrid[Math.floor(Math.random() * ROWS)][0] = "SCATTER";
      finalGrid[Math.floor(Math.random() * ROWS)][2] = "SCATTER";
      finalGrid[Math.floor(Math.random() * ROWS)][4] = "SCATTER";
    }
  } else {
    let attempts = 0;
    while (attempts < 10) {
      finalGrid = Array.from(
        { length: ROWS },
        () => Array.from({ length: COLS }, () => MYSTIC_WEIGHTED_SYMBOLS[Math.floor(Math.random() * MYSTIC_WEIGHTED_SYMBOLS.length)])
      );
      const col0 = finalGrid.map((r) => r[0]);
      const col1 = finalGrid.map((r) => r[1]);
      let hasWin = false;
      finalGrid.forEach((row, rIdx) => {
        const s = row[2];
        if (col0.includes(s) || col1.includes(s) || s === "WILD") {
          hasWin = true;
          finalGrid[rIdx][2] = "9";
        }
      });
      if (!hasWin) break;
      attempts++;
    }
    if (Math.random() < 0.08) {
      finalGrid[Math.floor(Math.random() * ROWS)][0] = "SCATTER";
      finalGrid[Math.floor(Math.random() * ROWS)][3] = "SCATTER";
    }
  }
  const topMultipliers = Array.from({ length: 5 }, () => getRandomMultiplier());
  let totalWin = 0;
  let newWinningPositions = [];
  let newWinningMults = [];
  let scatterCount = 0;
  finalGrid.forEach((row) => {
    row.forEach((sym) => {
      if (sym === "SCATTER") scatterCount++;
    });
  });
  const wonFreeSpins = scatterCount >= 3;
  const currentMultiplier = freeSpins > 0 ? freeSpinMultiplier : 1;
  Object.keys(MYSTIC_PAYTABLE).forEach((symbol) => {
    let ways = 1;
    let matchCount = 0;
    let symbolWinningPositions = [];
    let colsCounts = [];
    for (let c = 0; c < COLS; c++) {
      let countInCol = 0;
      let colPositions = [];
      for (let r = 0; r < ROWS; r++) {
        if (finalGrid[r][c] === symbol || finalGrid[r][c] === "WILD") {
          countInCol++;
          colPositions.push({ r, c });
        }
      }
      if (countInCol > 0) {
        colsCounts.push(countInCol);
        ways *= countInCol;
        matchCount++;
        symbolWinningPositions.push(...colPositions);
      } else {
        break;
      }
    }
    if (matchCount >= 3) {
      const payoutMultiplier = MYSTIC_PAYTABLE[symbol][matchCount];
      if (payoutMultiplier > 0) {
        let multSum = 0;
        for (let c = 0; c < matchCount; c++) {
          if (colsCounts[c] >= 3) {
            multSum += topMultipliers[c];
            if (!newWinningMults.includes(c)) {
              newWinningMults.push(c);
            }
          }
        }
        const finalMult = multSum > 0 ? multSum : 1;
        let winAmount = bet * payoutMultiplier * ways * finalMult * currentMultiplier;
        if (targetPrize > 0) {
          const remainingCap = targetPrize - totalWin;
          if (winAmount > remainingCap) {
            winAmount = Math.max(0, remainingCap);
          }
        }
        totalWin += winAmount;
        symbolWinningPositions.forEach((pos) => {
          if (pos.c < matchCount && !newWinningPositions.some((p) => p.r === pos.r && p.c === pos.c)) {
            newWinningPositions.push(pos);
          }
        });
      }
    }
  });
  return {
    gameId: isWildTattoo ? "wild-tattoo" : "mystic-ink",
    targetPrize,
    finalGrid,
    totalWin: Math.round(totalWin * 100) / 100,
    winningPositions: newWinningPositions,
    winningMults: newWinningMults,
    scatterCount,
    wonFreeSpins,
    topMultipliers
  };
}
var CALAVERA_WEIGHTED_SYMBOLS = [
  "10",
  "10",
  "10",
  "10",
  "J",
  "J",
  "J",
  "Q",
  "Q",
  "Q",
  "K",
  "K",
  "A",
  "A",
  "MARACAS",
  "MARACAS",
  "GUITAR",
  "GUITAR",
  "TEQUILA",
  "GUN",
  "SKULL",
  "SCATTER"
];
function computeCalaveraInkOutcome(targetPrize, activeBet, freeSpinsActive, freeSpinsMultiplier) {
  const ROWS = 4;
  const COLS = 5;
  let finalGrid = [];
  if (targetPrize > 0) {
    const highSyms = ["SKULL", "GUN", "TEQUILA", "GUITAR", "MARACAS"];
    const winSym = targetPrize > activeBet * 5 ? "SKULL" : highSyms[Math.floor(Math.random() * highSyms.length)];
    finalGrid = Array.from(
      { length: ROWS },
      () => Array.from({ length: COLS }, () => CALAVERA_WEIGHTED_SYMBOLS[Math.floor(Math.random() * CALAVERA_WEIGHTED_SYMBOLS.length)])
    );
    const matchCols = Math.min(5, Math.floor(Math.random() * 2) + 3);
    for (let c = 0; c < matchCols; c++) {
      const r = Math.floor(Math.random() * ROWS);
      finalGrid[r][c] = winSym;
    }
    if (Math.random() < 0.25) {
      finalGrid[Math.floor(Math.random() * ROWS)][2] = "WILD";
    }
  } else {
    let attempts = 0;
    while (attempts < 10) {
      finalGrid = Array.from(
        { length: ROWS },
        () => Array.from({ length: COLS }, () => CALAVERA_WEIGHTED_SYMBOLS[Math.floor(Math.random() * CALAVERA_WEIGHTED_SYMBOLS.length)])
      );
      const col0 = finalGrid.map((r) => r[0]);
      const col1 = finalGrid.map((r) => r[1]);
      let hasWin = false;
      finalGrid.forEach((row, rIdx) => {
        const s = row[2];
        if (col0.includes(s) || col1.includes(s) || s === "WILD") {
          hasWin = true;
          finalGrid[rIdx][2] = "10";
        }
      });
      if (!hasWin) break;
      attempts++;
    }
  }
  const goldenFrames = [];
  for (let c = 1; c <= 3; c++) {
    if (Math.random() < 0.5) {
      const r = Math.floor(Math.random() * ROWS);
      goldenFrames.push(`${r}_${c}`);
    }
  }
  let scatterCount = 0;
  finalGrid.forEach((row) => {
    row.forEach((s) => {
      if (s === "SCATTER") scatterCount++;
    });
  });
  return {
    gameId: "calavera-ink",
    targetPrize,
    finalGrid,
    goldenFrames,
    initialWin: targetPrize,
    winningPositions: [],
    scatterCount,
    wonFreeSpins: scatterCount >= 3
  };
}
var generateLeftNotes = (bet) => [
  { id: "l1", type: "cash", value: 0.5, label: `R$ ${(bet * 0.5).toFixed(2)}`, color: "from-blue-600/90 to-cyan-500/90", artType: "skull" },
  { id: "l2", type: "cash", value: 1, label: `R$ ${(bet * 1).toFixed(2)}`, color: "from-emerald-600/90 to-teal-500/90", artType: "rose" },
  { id: "l3", type: "cash", value: 2, label: `R$ ${(bet * 2).toFixed(2)}`, color: "from-purple-600/90 to-indigo-500/90", artType: "tiger" },
  { id: "l4", type: "cash", value: 5, label: `R$ ${(bet * 5).toFixed(2)}`, color: "from-amber-600/90 to-orange-500/90", artType: "dragon" },
  { id: "l5", type: "cash", value: 10, label: `R$ ${(bet * 10).toFixed(2)}`, color: "from-rose-600/90 to-pink-500/90", artType: "machine" },
  { id: "l6", type: "cash", value: 50, label: `R$ ${(bet * 50).toFixed(2)}`, color: "from-yellow-500 to-amber-500", artType: "adriano" },
  { id: "l7", type: "cash", value: 100, label: `R$ ${(bet * 100).toFixed(2)}`, color: "from-fuchsia-600 to-rose-500", artType: "adriano" }
];
var generateRightNotes = (bet) => [
  { id: "r1", type: "cash", value: 0.5, label: `R$ ${(bet * 0.5).toFixed(2)}`, color: "from-blue-600/90 to-cyan-500/90", artType: "skull" },
  { id: "r2", type: "cash", value: 2, label: `R$ ${(bet * 2).toFixed(2)}`, color: "from-purple-600/90 to-indigo-500/90", artType: "tiger" },
  { id: "r3", type: "multiplier", value: 2, label: "x2", color: "from-orange-500 to-red-600", artType: "dragon" },
  { id: "r4", type: "multiplier", value: 5, label: "x5", color: "from-amber-500 to-orange-600", artType: "rose" },
  { id: "r5", type: "multiplier", value: 10, label: "x10", color: "from-yellow-400 to-amber-500", artType: "machine" },
  { id: "r6", type: "multiplier", value: 100, label: "x100", color: "from-pink-500 to-rose-600", artType: "adriano" }
];
var CENTER_ACTIVATORS = [
  { id: "c1", type: "activator", value: 1, label: "PAGUE COIN", color: "from-yellow-400 via-amber-400 to-yellow-600", artType: "machine" },
  { id: "c2", type: "free_spins", value: 5, label: "5 FREE SPINS", color: "from-teal-400 via-emerald-400 to-teal-600", artType: "adriano" },
  { id: "c3", type: "blank", value: 0, label: "TATUAGEM", color: "from-neutral-800 to-neutral-750", artType: "skull" },
  { id: "c4", type: "blank", value: 0, label: "ROSAS", color: "from-neutral-800 to-neutral-750", artType: "rose" }
];
function computeTattooCashOutcome(targetPrize, bet, freeSpins) {
  const leftOpts = generateLeftNotes(bet);
  const rightOpts = generateRightNotes(bet);
  let finalLeft;
  let finalCenter;
  let finalRight;
  let isWin = false;
  let winAmount = 0;
  let freeSpinsWon = 0;
  if (targetPrize > 0) {
    finalCenter = CENTER_ACTIVATORS[0];
    isWin = true;
    const targetMult = targetPrize / bet;
    const multOpt = rightOpts.find((r) => r.type === "multiplier" && r.value > 1 && leftOpts.some((l) => l.value * r.value === targetMult));
    if (multOpt) {
      finalRight = multOpt;
      finalLeft = leftOpts.find((l) => l.value * multOpt.value === targetMult) || leftOpts[0];
      winAmount = finalLeft.value * finalRight.value * bet;
    } else {
      const sumMatch = leftOpts.find((l) => rightOpts.some((r) => r.type === "cash" && l.value + r.value === targetMult));
      if (sumMatch) {
        finalLeft = sumMatch;
        finalRight = rightOpts.find((r) => r.type === "cash" && sumMatch.value + r.value === targetMult);
        winAmount = (finalLeft.value + finalRight.value) * bet;
      } else {
        finalLeft = leftOpts[0];
        finalRight = rightOpts[0];
        winAmount = (finalLeft.value + finalRight.value) * bet;
      }
    }
    if (targetPrize > 0 && winAmount > targetPrize) {
      winAmount = targetPrize;
    }
  } else {
    finalCenter = CENTER_ACTIVATORS[2 + Math.floor(Math.random() * 2)];
    finalLeft = leftOpts[Math.floor(Math.random() * leftOpts.length)];
    finalRight = rightOpts[Math.floor(Math.random() * rightOpts.length)];
  }
  const getRandomNote = (reel) => {
    if (reel === "left") return leftOpts[Math.floor(Math.random() * leftOpts.length)];
    if (reel === "right") return rightOpts[Math.floor(Math.random() * rightOpts.length)];
    return CENTER_ACTIVATORS[Math.floor(Math.random() * CENTER_ACTIVATORS.length)];
  };
  return {
    gameId: "tattoo-cash",
    targetPrize,
    finalLeft,
    finalCenter,
    finalRight,
    reelLeft: [getRandomNote("left"), finalLeft, getRandomNote("left")],
    reelCenter: [getRandomNote("center"), finalCenter, getRandomNote("center")],
    reelRight: [getRandomNote("right"), finalRight, getRandomNote("right")],
    isWin,
    winAmount: Math.round(winAmount * 100) / 100,
    freeSpinsWon
  };
}
var WHEEL_SLICES = [
  { id: 0, label: "JACKPOT", value: 1e3, color: "from-[#f59e0b] to-[#b45309]", textColor: "#ffffff", subText: "1000x" },
  { id: 1, label: "QUASE!", value: 0.5, color: "from-[#334155] to-[#1e293b]", textColor: "#94a3b8", subText: "0.5x" },
  { id: 2, label: "REGULAR", value: 10, color: "from-[#3b82f6] to-[#1d4ed8]", textColor: "#ffffff", subText: "10x" },
  { id: 3, label: "SALVO!", value: 2, color: "from-[#10b981] to-[#047857]", textColor: "#ffffff", subText: "2x" },
  { id: 4, label: "SUPER WIN", value: 50, color: "from-[#8b5cf6] to-[#5b21b6]", textColor: "#ffffff", subText: "50x" },
  { id: 5, label: "NADA", value: 0, color: "from-[#0f172a] to-[#020617]", textColor: "#475569", subText: "0x" },
  { id: 6, label: "MINI", value: 5, color: "from-[#06b6d4] to-[#0891b2]", textColor: "#ffffff", subText: "5x" },
  { id: 7, label: "BIG WIN", value: 100, color: "from-[#f97316] to-[#c2410c]", textColor: "#ffffff", subText: "100x" },
  { id: 8, label: "IPHONE 15", value: 500, color: "from-[#ec4899] to-[#9d174d]", textColor: "#ffffff", subText: "B\xD4NUS", isIphone: true },
  { id: 9, label: "NADA", value: 0, color: "from-[#0f172a] to-[#020617]", textColor: "#475569", subText: "0x" },
  { id: 10, label: "BOOST", value: 20, color: "from-[#10b981] to-[#064e3b]", textColor: "#ffffff", subText: "20x" },
  { id: 11, label: "QUASE!", value: 0.1, color: "from-[#334155] to-[#1e293b]", textColor: "#64748b", subText: "0.1x" },
  { id: 12, label: "MEGA WIN", value: 250, color: "from-[#6366f1] to-[#3730a3]", textColor: "#ffffff", subText: "250x" },
  { id: 13, label: "NADA", value: 0, color: "from-[#0f172a] to-[#020617]", textColor: "#475569", subText: "0x" },
  { id: 14, label: "PLUS", value: 15, color: "from-[#14b8a6] to-[#0f766e]", textColor: "#ffffff", subText: "15x" },
  { id: 15, label: "EPIC WIN", value: 500, color: "from-[#f43f5e] to-[#9f1239]", textColor: "#ffffff", subText: "500x" }
];
function computeRoulettaInkOutcome(targetPrize, bet, isFeverActive) {
  let targetMultiplier = targetPrize / bet;
  if (isFeverActive) {
    targetMultiplier = targetMultiplier / 1.5;
  }
  let targetSliceIndex = 5;
  let minDiff = Infinity;
  WHEEL_SLICES.forEach((slice, idx) => {
    const diff = Math.abs(slice.value - targetMultiplier);
    if (diff < minDiff) {
      minDiff = diff;
      targetSliceIndex = idx;
    }
  });
  const targetSlice = WHEEL_SLICES[targetSliceIndex];
  let actualPayout = targetSlice.value * bet;
  if (isFeverActive && actualPayout > 0) {
    actualPayout = Math.round(actualPayout * 1.5 * 10) / 10;
  }
  return {
    gameId: "rouletta-ink",
    targetPrize,
    targetSliceIndex,
    targetSlice,
    actualPayout: Math.round(actualPayout * 100) / 100,
    isBigWin: actualPayout >= bet * 20
  };
}
var REVEAL_SYMBOLS = [
  { id: "crown", label: "COROA" },
  { id: "rose", label: "ROSA" },
  { id: "skull", label: "CAVEIRA" },
  { id: "heart", label: "CORA\xC7\xC3O" },
  { id: "dagger", label: "PUNHAL" },
  { id: "diamond", label: "DIAMANTE" },
  { id: "star", label: "ESTRELA" },
  { id: "anchor", label: "\xC2NCORA" }
];
function computeInkRevealOutcome(wonAmount, bet) {
  const chosenCells = [];
  if (wonAmount > 0) {
    const winningSymbol = wonAmount >= bet * 10 ? REVEAL_SYMBOLS[0] : REVEAL_SYMBOLS[Math.floor(Math.random() * REVEAL_SYMBOLS.length)];
    const allIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = allIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }
    const winningIndices = allIndices.slice(0, 3);
    for (let i = 0; i < 9; i++) {
      if (winningIndices.includes(i)) {
        chosenCells.push({
          id: i,
          symbolId: winningSymbol.id,
          revealed: false,
          isWinning: true,
          prizeLabel: `R$ ${wonAmount.toFixed(2)}`
        });
      } else {
        let randomSymbol = REVEAL_SYMBOLS[Math.floor(Math.random() * REVEAL_SYMBOLS.length)];
        while (randomSymbol.id === winningSymbol.id) {
          randomSymbol = REVEAL_SYMBOLS[Math.floor(Math.random() * REVEAL_SYMBOLS.length)];
        }
        chosenCells.push({
          id: i,
          symbolId: randomSymbol.id,
          revealed: false,
          isWinning: false,
          prizeLabel: `R$ ${(bet * (0.5 + Math.random() * 2)).toFixed(2)}`
        });
      }
    }
  } else {
    const symbolPool = [];
    REVEAL_SYMBOLS.forEach((s) => {
      symbolPool.push(s);
      symbolPool.push(s);
    });
    for (let i = symbolPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [symbolPool[i], symbolPool[j]] = [symbolPool[j], symbolPool[i]];
    }
    for (let i = 0; i < 9; i++) {
      chosenCells.push({
        id: i,
        symbolId: symbolPool[i].id,
        revealed: false,
        isWinning: false,
        prizeLabel: `R$ ${(bet * (0.1 + Math.random() * 1.5)).toFixed(2)}`
      });
    }
  }
  return {
    gameId: "ink-reveal",
    targetPrize: wonAmount,
    wonAmount: Math.round(wonAmount * 100) / 100,
    grid: chosenCells
  };
}

// server/app.ts
var { url: validServerUrl, key: validServerKey } = getValidSupabaseCredentials();
console.log("Supabase initialized with URL:", validServerUrl || "offline placeholder");
var supabase2 = createClient3(
  validServerUrl || "https://placeholder.supabase.co",
  validServerKey || "placeholder"
);
var app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  const matched = req.headers["x-matched-path"] || req.headers["x-invoke-path"];
  if (matched && typeof matched === "string" && (matched.startsWith("/api") || matched.startsWith("/webhook") || matched.startsWith("/app/webhook"))) {
    req.url = matched;
  }
  next();
});
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase2.from("users").select("*");
    if (error) {
      console.log("Supabase info fetching users:", error.message || error);
      return res.json([]);
    }
    res.json((data || []).map((u) => ({
      ...u,
      unlockFirstWithdrawal: !!u.unlockFirstWithdrawal,
      referralCounted: !!u.referralCounted
    })));
  } catch (error) {
    console.log("Supabase offline/unreachable for users:", error.message || error);
    res.json([]);
  }
});
app.post("/api/users", async (req, res) => {
  console.log("POST /api/users called with body:", JSON.stringify(req.body));
  try {
    const { id, name, email, password, role, balance, earnings, createdAt, dailyPrizeTotal, lastPrizeDate, lastLoginBonusDate, referrals, unlockFirstWithdrawal, referralLink, withdrawalsCount, referredBy, referralCounted, phone } = req.body;
    console.log("Saving user:", id);
    const payload = {
      id,
      name,
      email,
      password,
      role,
      balance,
      earnings,
      createdAt,
      dailyPrizeTotal,
      lastPrizeDate,
      lastLoginBonusDate: lastLoginBonusDate || null,
      referrals: referrals || 0,
      unlockFirstWithdrawal: unlockFirstWithdrawal ? true : false,
      referralLink: referralLink || "",
      withdrawalsCount: withdrawalsCount || 0,
      referredBy: referredBy || null,
      referralCounted: referralCounted ? true : false,
      phone: phone || null
    };
    let { error } = await supabase2.from("users").upsert(payload);
    if (error && (error.message?.toLowerCase().includes("column") || error.message?.toLowerCase().includes("does not exist") || error.message?.toLowerCase().includes("schema"))) {
      delete payload.lastLoginBonusDate;
      delete payload.phone;
      const res2 = await supabase2.from("users").upsert(payload);
      error = res2.error;
      if (error && error.message?.toLowerCase().includes("column")) {
        const minimalPayload = {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: payload.role,
          balance: payload.balance,
          earnings: payload.earnings,
          createdAt: payload.createdAt,
          dailyPrizeTotal: payload.dailyPrizeTotal || 0,
          lastPrizeDate: payload.lastPrizeDate || null
        };
        const res3 = await supabase2.from("users").upsert(minimalPayload);
        error = res3.error;
      }
    }
    if (error) {
      console.log("Supabase save user status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note saving user:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.get("/api/games", async (req, res) => {
  try {
    const { data, error } = await supabase2.from("games").select("*");
    if (error) {
      console.log("Supabase info fetching games:", error.message || error);
      return res.json([]);
    }
    res.json((data || []).map((g) => ({ ...g, active: !!g.active, featured: !!g.featured })));
  } catch (error) {
    console.log("Supabase offline/unreachable for games:", error.message || error);
    res.json([]);
  }
});
app.post("/api/games", async (req, res) => {
  try {
    const { id, name, active, minBet, maxBet, rtp, thumbnail, bgPage, bgContainer, bgMusic, category, featured } = req.body;
    const payload = {
      id,
      name,
      active: !!active,
      minBet,
      maxBet,
      rtp,
      thumbnail,
      bgPage,
      bgContainer,
      bgMusic,
      category,
      featured: !!featured
    };
    let { error } = await supabase2.from("games").upsert(payload);
    if (error && (error.message?.toLowerCase().includes("featured") || error.message?.toLowerCase().includes("column"))) {
      delete payload.featured;
      const res2 = await supabase2.from("games").upsert(payload);
      error = res2.error;
      if (error && error.message?.toLowerCase().includes("column")) {
        const minimalPayload = {
          id: payload.id,
          name: payload.name,
          active: payload.active,
          rtp: payload.rtp,
          category: payload.category
        };
        const res3 = await supabase2.from("games").upsert(minimalPayload);
        error = res3.error;
      }
    }
    if (error) {
      console.log("Supabase save game status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note saving game:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.post("/api/slots/spin", async (req, res) => {
  try {
    const {
      userId,
      gameId,
      baseBet = 1,
      activeBet = 1,
      bet = 1,
      betPerLine = 1,
      totalBet = 1,
      freeSpins = 0,
      freeSpinsActive = false,
      freeSpinsMultiplier = 1,
      freeSpinMultiplier = 1,
      doubleChance = false,
      tigerActive = true,
      dragonActive = true,
      isWildTattoo = false,
      isFeverActive = false
    } = req.body;
    let targetPrize = 0;
    let userRole = "user";
    let settingsData = null;
    let userData = null;
    try {
      if (userId) {
        const { data: u } = await supabase2.from("users").select("*").eq("id", userId).single();
        if (u) {
          userData = u;
          userRole = u.role || "user";
        }
      }
      const { data: s } = await supabase2.from("settings").select("data").eq("id", "global").single();
      if (s && s.data) {
        settingsData = s.data;
      }
    } catch (e) {
      console.warn("Supabase fetch error in /api/slots/spin:", e);
    }
    const prizeCategory = gameId === "rouletta-ink" ? "roletas" : "slots";
    if (settingsData && settingsData.gamePrizes) {
      const gamePrizeConfig = settingsData.gamePrizes.find((p) => p.gameId === prizeCategory || p.gameId === "slots") || settingsData.gamePrizes[0];
      if (gamePrizeConfig && gamePrizeConfig.premios) {
        const tiers = gamePrizeConfig.premios;
        const adjustedTiers = tiers.map((t, idx) => {
          if (userRole === "partner" && idx >= tiers.length - 2) {
            return { ...t, peso: t.peso * 4 };
          }
          return t;
        });
        const totalWeight = adjustedTiers.reduce((acc, t) => acc + (t.peso || 0), 0);
        let rand = Math.random() * totalWeight;
        let selectedTier = adjustedTiers[0];
        for (const tier of adjustedTiers) {
          if (rand < tier.peso) {
            selectedTier = tier;
            break;
          }
          rand -= tier.peso;
        }
        let pAmount = Math.floor(Math.random() * (selectedTier.premioMax - selectedTier.premioMin + 1)) + selectedTier.premioMin;
        pAmount = Math.min(pAmount, 1e3);
        if (userData) {
          const userLimit = Math.min(
            userRole === "partner" ? (settingsData.limiteUsuarioDiario || 100) * 5 : settingsData.limiteUsuarioDiario || 100,
            1e3
          );
          const userRemaining = userLimit - (userData.dailyPrizeTotal || 0);
          if (pAmount > userRemaining) pAmount = Math.max(0, userRemaining);
        }
        const platformRemaining = (settingsData.limitePlataformaDiario || 500) - (settingsData.platformDailyPrizeTotal || 0);
        if (pAmount > platformRemaining) pAmount = Math.max(0, platformRemaining);
        targetPrize = pAmount;
      }
    }
    let result;
    if (gameId === "tattoo-slot") {
      result = computeTattooSlotOutcome(
        targetPrize,
        baseBet,
        freeSpinsActive,
        freeSpinsMultiplier,
        doubleChance
      );
    } else if (gameId === "yakuza-ink") {
      result = computeYakuzaInkOutcome(targetPrize, betPerLine, tigerActive, dragonActive);
    } else if (gameId === "mystic-ink" || gameId === "wild-tattoo") {
      result = computeMysticInkOutcome(
        targetPrize,
        bet || activeBet || baseBet,
        freeSpins,
        freeSpinMultiplier || freeSpinsMultiplier,
        isWildTattoo || gameId === "wild-tattoo"
      );
    } else if (gameId === "calavera-ink") {
      result = computeCalaveraInkOutcome(
        targetPrize,
        activeBet || baseBet || bet,
        freeSpinsActive,
        freeSpinsMultiplier
      );
    } else if (gameId === "tattoo-cash") {
      result = computeTattooCashOutcome(
        targetPrize,
        bet || baseBet || activeBet,
        freeSpins
      );
    } else if (gameId === "rouletta-ink") {
      result = computeRoulettaInkOutcome(
        targetPrize,
        bet || 1,
        isFeverActive
      );
    } else if (gameId === "ink-reveal") {
      result = computeInkRevealOutcome(
        targetPrize,
        bet || 1
      );
    } else {
      return res.status(400).json({ error: "Invalid gameId" });
    }
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Error in /api/slots/spin:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});
app.get("/api/transactions", async (req, res) => {
  try {
    const { data, error } = await supabase2.from("transactions").select("*").order("date", { ascending: false });
    if (error) {
      console.warn("Supabase info fetching transactions:", error.message || error);
      return res.json([]);
    }
    res.json((data || []).map((t) => ({ ...t, metadata: t.metadata ? typeof t.metadata === "string" ? JSON.parse(t.metadata) : t.metadata : null })));
  } catch (error) {
    console.log("Supabase offline/unreachable for transactions:", error.message || error);
    res.json([]);
  }
});
app.post("/api/transactions", async (req, res) => {
  try {
    const { id, userId, type, amount, status, date, gameId, metadata } = req.body;
    const { error } = await supabase2.from("transactions").upsert({
      id,
      userId,
      type,
      amount,
      status,
      date,
      gameId,
      metadata: metadata || null
    });
    if (error) {
      console.log("Supabase save transaction status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note saving transaction:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.get("/api/settings", async (req, res) => {
  try {
    const { data, error } = await supabase2.from("settings").select("data").eq("id", "global").maybeSingle();
    if (error) {
      console.log("Supabase info fetching settings:", error.message || error);
      return res.json(null);
    }
    if (data && data.data) {
      res.json(typeof data.data === "string" ? JSON.parse(data.data) : data.data);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.log("Supabase offline/unreachable for settings:", error.message || error);
    res.json(null);
  }
});
app.post("/api/settings", async (req, res) => {
  try {
    const { error } = await supabase2.from("settings").upsert({
      id: "global",
      data: req.body
    });
    if (error) {
      console.log("Supabase save settings status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note saving settings:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.get("/api/notifications", async (req, res) => {
  try {
    const { data, error } = await supabase2.from("notifications").select("*").order("createdAt", { ascending: false });
    if (error) {
      if (error.code === "42P01" || error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.message?.includes("fetch failed") || error.message?.includes("ENOTFOUND")) {
        return res.json([]);
      }
      console.log("Supabase info fetching notifications:", error.message || error);
      return res.json([]);
    }
    res.json(data || []);
  } catch (error) {
    console.log("Supabase offline/unreachable for notifications:", error.message || error);
    res.json([]);
  }
});
app.post("/api/notifications", async (req, res) => {
  try {
    const { id, title, message, type, createdAt, targetUserId } = req.body;
    const { error } = await supabase2.from("notifications").upsert({
      id,
      title,
      message,
      type,
      createdAt,
      targetUserId: targetUserId || null
    });
    if (error) {
      console.log("Supabase save notification status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note saving notification:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.delete("/api/notifications/:id", async (req, res) => {
  try {
    const { error } = await supabase2.from("notifications").delete().eq("id", req.params.id);
    if (error) {
      console.log("Supabase delete notification status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note deleting notification:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.delete("/api/transactions", async (req, res) => {
  try {
    const { error } = await supabase2.from("transactions").delete().neq("id", "none");
    if (error) {
      console.log("Supabase delete transactions status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note deleting transactions:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.post("/api/admin/reset-financial-data", async (req, res) => {
  try {
    console.log("Resetting all financial data, transactions and user balances...");
    try {
      await supabase2.from("transactions").delete().neq("id", "none");
    } catch (txErr) {
      console.warn("Error deleting transactions:", txErr);
    }
    try {
      const { data: allUsers } = await supabase2.from("users").select("id");
      if (allUsers && allUsers.length > 0) {
        for (const u of allUsers) {
          await supabase2.from("users").update({
            balance: 0,
            earnings: 0,
            dailyPrizeTotal: 0,
            withdrawalsCount: 0
          }).eq("id", u.id);
        }
      }
    } catch (uErr) {
      console.warn("Error resetting user balances:", uErr);
    }
    try {
      const { data: s } = await supabase2.from("settings").select("data").eq("id", "global").single();
      if (s && s.data) {
        const parsed = typeof s.data === "string" ? JSON.parse(s.data) : s.data;
        parsed.platformDailyPrizeTotal = 0;
        await supabase2.from("settings").upsert({ id: "global", data: parsed });
      }
    } catch (sErr) {
      console.warn("Error resetting platformDailyPrizeTotal:", sErr);
    }
    res.json({ success: true, message: "Dados financeiros zerados com sucesso. Usu\xE1rios mantidos." });
  } catch (error) {
    console.log("Error in /api/admin/reset-financial-data:", error);
    res.json({ success: true, offline: true });
  }
});
app.delete("/api/users", async (req, res) => {
  try {
    const { error } = await supabase2.from("users").delete().neq("id", "none");
    if (error) {
      console.log("Supabase delete users status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note deleting users:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await supabase2.from("transactions").delete().eq("userId", id);
    } catch (e) {
    }
    const { error } = await supabase2.from("users").delete().eq("id", id);
    if (error) {
      console.log("Supabase delete user status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note deleting user:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.get("/api/promotions", async (req, res) => {
  try {
    const { data, error } = await supabase2.from("promotions").select("*").order("createdAt", { ascending: false });
    if (error) {
      if (error.code === "42P01" || error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.message?.includes("fetch failed") || error.message?.includes("ENOTFOUND")) {
        return res.json([]);
      }
      console.log("Supabase info fetching promotions:", error.message || error);
      return res.json([]);
    }
    res.json((data || []).map((p) => ({ ...p, active: !!p.active })));
  } catch (error) {
    console.log("Supabase offline/unreachable for promotions:", error.message || error);
    res.json([]);
  }
});
app.post("/api/promotions", async (req, res) => {
  try {
    const { id, title, description, code, discount, active, createdAt } = req.body;
    const { error } = await supabase2.from("promotions").upsert({
      id,
      title,
      description,
      code,
      discount,
      active: !!active,
      createdAt
    });
    if (error) {
      console.log("Supabase save promotion status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note saving promotion:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.delete("/api/promotions/:id", async (req, res) => {
  try {
    const { error } = await supabase2.from("promotions").delete().eq("id", req.params.id);
    if (error) {
      console.log("Supabase delete promotion status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note deleting promotion:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.get("/api/banners", async (req, res) => {
  try {
    const { data, error } = await supabase2.from("banners").select("*").order("createdAt", { ascending: false });
    if (error) {
      if (error.code === "42P01" || error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.message?.includes("fetch failed") || error.message?.includes("ENOTFOUND")) {
        return res.json([]);
      }
      console.log("Supabase info fetching banners:", error.message || error);
      return res.json([]);
    }
    res.json((data || []).map((b) => ({ ...b, active: !!b.active })));
  } catch (error) {
    console.log("Supabase offline/unreachable for banners:", error.message || error);
    res.json([]);
  }
});
app.post("/api/banners", async (req, res) => {
  try {
    const { id, imageUrl, link, active, createdAt } = req.body;
    const { error } = await supabase2.from("banners").upsert({
      id,
      imageUrl,
      link,
      active: !!active,
      createdAt
    });
    if (error) {
      console.log("Supabase save banner status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note saving banner:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
app.delete("/api/banners/:id", async (req, res) => {
  try {
    const { error } = await supabase2.from("banners").delete().eq("id", req.params.id);
    if (error) {
      console.log("Supabase delete banner status:", error.message || error);
      return res.json({ success: true, warning: error.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Internal/network note deleting banner:", error.message || error);
    res.json({ success: true, offline: true });
  }
});
var pixupCachedToken = null;
var pixupTokenExpiresAt = 0;
async function getPixupAccessToken(clientId, clientSecret) {
  const cId = (clientId || "").trim();
  const cSecret = (clientSecret || "").trim();
  if (!cId || !cSecret) {
    throw new Error("Client ID e Client Secret da PixUP n\xE3o configurados.");
  }
  const now = Date.now();
  if (pixupCachedToken && pixupTokenExpiresAt > now + 3e4) {
    return pixupCachedToken;
  }
  const basicAuth = Buffer.from(`${cId}:${cSecret}`).toString("base64");
  console.log(`[PixUP Auth] Gerando token para Client ID: ${cId.substring(0, 10)}...`);
  const authRes = await fetch("https://api.pixupbr.com/v2/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/json"
    }
  });
  const authData = await authRes.json();
  if (!authRes.ok || authData.success === false) {
    const errDetail = authData.error?.message || authData.message || authData.error || "Falha na autentica\xE7\xE3o da PixUP. Verifique Client ID e Client Secret.";
    console.error("[PixUP Auth] Erro:", authRes.status, authData);
    throw new Error(`Erro PixUP: ${errDetail}`);
  }
  const token = authData.access_token || authData.accessToken || authData.token || authData.data?.access_token;
  const expiresIn = authData.expires_in || authData.expiresIn || 3600;
  if (!token) {
    throw new Error("Token n\xE3o retornado pela PixUP.");
  }
  pixupCachedToken = token;
  pixupTokenExpiresAt = Date.now() + Number(expiresIn) * 1e3;
  return token;
}
app.post("/api/pixup/test", async (req, res) => {
  try {
    const { clientId: reqCId, clientSecret: reqCSecret } = req.body || {};
    let cId = (reqCId || "").trim() || process.env.PIXUP_CLIENT_ID || process.env.VITE_PIXUP_CLIENT_ID || "adrianoledio_f27410f412960abf";
    let cSecret = (reqCSecret || "").trim() || process.env.PIXUP_CLIENT_SECRET || process.env.VITE_PIXUP_CLIENT_SECRET || "";
    if (!cSecret) {
      try {
        const { data: settingsData } = await supabase2.from("settings").select("data").eq("id", "global").maybeSingle();
        if (settingsData && settingsData.data) {
          const s = typeof settingsData.data === "string" ? JSON.parse(settingsData.data) : settingsData.data;
          if (s.pixupClientSecret) cSecret = s.pixupClientSecret.trim();
          if (s.pixupClientId) cId = s.pixupClientId.trim();
        }
      } catch (e) {
      }
    }
    if (!cSecret) {
      return res.json({ success: false, error: "Client Secret n\xE3o fornecido. Preencha o Client Secret da PixUP." });
    }
    const basicAuth = Buffer.from(`${cId}:${cSecret}`).toString("base64");
    const authRes = await fetch("https://api.pixupbr.com/v2/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json"
      }
    });
    const responseText = await authRes.text();
    let authData = {};
    try {
      authData = JSON.parse(responseText);
    } catch (e) {
      authData = { message: responseText };
    }
    if (!authRes.ok || authData.success === false) {
      const errDetail = authData.error?.message || authData.message || authData.error || `HTTP ${authRes.status}: Credenciais recusadas pela PixUP.`;
      return res.json({ success: false, error: errDetail });
    }
    return res.json({ success: true, message: "Conex\xE3o PixUP testada e aprovada com sucesso!" });
  } catch (err) {
    return res.json({ success: false, error: err.message || "Erro ao conectar com PixUP" });
  }
});
app.post("/api/payments/pix", async (req, res) => {
  try {
    const {
      amount,
      userId,
      email,
      name,
      cpf,
      bonus,
      clientId: clientPassedId,
      clientSecret: clientPassedSecret,
      pixupClientId: clientPassedPixupId,
      pixupClientSecret: clientPassedPixupSecret,
      token: clientToken,
      postbackUrl: clientPostback
    } = req.body;
    let clientId = (clientPassedPixupId || clientPassedId || "").trim() || process.env.PIXUP_CLIENT_ID || process.env.VITE_PIXUP_CLIENT_ID || "";
    let clientSecret = (clientPassedPixupSecret || clientPassedSecret || "").trim() || process.env.PIXUP_CLIENT_SECRET || process.env.VITE_PIXUP_CLIENT_SECRET || "";
    let postback_url = (clientPostback || "").trim() || process.env.PIXUP_POSTBACK_URL || "https://ltjogos.vercel.app/webhook";
    let directToken = (clientToken || "").trim() || process.env.PIXUP_API_TOKEN || process.env.PIXUP_TOKEN || "";
    let settings = null;
    if ((!clientId || !clientSecret) && !directToken) {
      try {
        const { data: settingsData } = await supabase2.from("settings").select("data").eq("id", "global").maybeSingle();
        if (settingsData && settingsData.data) {
          settings = typeof settingsData.data === "string" ? JSON.parse(settingsData.data) : settingsData.data;
          if (settings) {
            if (!clientId) clientId = (settings.pixupClientId || "").trim();
            if (!clientSecret) clientSecret = (settings.pixupClientSecret || "").trim();
            if (settings.pixupPostbackUrl) postback_url = settings.pixupPostbackUrl.trim();
            if (!directToken) directToken = (settings.pixupToken || settings.mpAccessToken || "").trim();
          }
        }
      } catch (e) {
        console.warn("N\xE3o foi poss\xEDvel buscar configura\xE7\xF5es do Supabase:", e);
      }
    }
    if (!clientId) {
      clientId = "adrianoledio_f27410f412960abf";
    }
    let authToken = directToken;
    if (!authToken && clientId && clientSecret) {
      authToken = await getPixupAccessToken(clientId, clientSecret);
    }
    if (!authToken) {
      console.error("Credenciais PixUP n\xE3o configuradas.");
      return res.status(400).json({
        error: "Credenciais PixUP n\xE3o configuradas. Adicione seu Client Secret no painel Admin (Configura\xE7\xF5es > Gateway)."
      });
    }
    const txId = "tx_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const payerEmail = email && email.includes("@") ? email : "usuario@ltjogos.com";
    const payerName = name && name.trim().length > 0 ? name.trim() : "Jogador LT Jogos";
    let cleanDoc = (cpf || "").replace(/\D/g, "");
    if (!cleanDoc || cleanDoc.length < 11) {
      const rnd = (n2) => Math.floor(Math.random() * n2);
      const mod = (dividend, divisor) => Math.round(dividend - Math.floor(dividend / divisor) * divisor);
      const n = Array(9).fill(0).map(() => rnd(9));
      let d1 = n.reduce((total, number, index) => total + number * (10 - index), 0);
      d1 = 11 - mod(d1, 11);
      if (d1 >= 10) d1 = 0;
      let d2 = d1 * 2 + n.reduce((total, number, index) => total + number * (11 - index), 0);
      d2 = 11 - mod(d2, 11);
      if (d2 >= 10) d2 = 0;
      cleanDoc = `${n.join("")}${d1}${d2}`;
    }
    const pixupPayload = {
      amount: Number(Number(amount).toFixed(2)),
      currency: "BRL",
      external_id: txId,
      payer: {
        name: payerName,
        email: payerEmail,
        document: cleanDoc
      },
      postback_url: postback_url || "https://ltjogos.vercel.app/webhook"
    };
    console.log("[PixUP] Chamando cashin:", JSON.stringify(pixupPayload));
    const pixupResponse = await fetch("https://api.pixupbr.com/v2/transactions/cashin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken.trim()}`
      },
      body: JSON.stringify(pixupPayload)
    });
    const pixupData = await pixupResponse.json();
    console.log("[PixUP] Resposta da API:", pixupResponse.status, JSON.stringify(pixupData));
    if (!pixupResponse.ok || pixupData.success === false) {
      console.error("Erro na PixUP:", pixupData);
      const detail = pixupData.message || pixupData.error || pixupData.details?.message || (typeof pixupData === "string" ? pixupData : "Erro ao gerar PIX na PixUP.");
      return res.status(pixupResponse.status >= 400 ? pixupResponse.status : 400).json({ error: detail, details: pixupData });
    }
    const resData = pixupData.data || pixupData;
    const pixupTxId = resData.transaction_id || resData.id || pixupData.request_id;
    const qrCode = resData.payment_info?.qrcode || resData.qrcode || resData.payment_info?.qr_code || resData.qr_code || "";
    const qrCodeBase64 = resData.payment_info?.qrcode_base64 || resData.payment_info?.qr_code_base64 || resData.qrcode_base64 || "";
    const metadata = {
      pixupTransactionId: pixupTxId,
      qrCode,
      qrCodeBase64,
      bonus: bonus || 0,
      gateway: "pixup"
    };
    try {
      await supabase2.from("transactions").insert({
        id: txId,
        userId,
        type: "deposit",
        amount: Number(amount),
        status: "pending",
        date: (/* @__PURE__ */ new Date()).toISOString(),
        metadata
      });
    } catch (txErr) {
      console.warn("Erro ao salvar transa\xE7\xE3o pendente no Supabase:", txErr);
    }
    res.json({
      success: true,
      transactionId: txId,
      pixupTransactionId: pixupTxId,
      qrCode,
      qrCodeBase64,
      expiresAt: resData.payment_info?.expires_at
    });
  } catch (error) {
    console.error("Erro interno ao gerar PIX PixUP:", error);
    res.status(500).json({ error: error.message || "Erro interno do servidor ao gerar PIX." });
  }
});
var handlePixupWebhook = async (req, res) => {
  try {
    const body = req.body || {};
    const query = req.query || {};
    console.log("[PixUP Webhook] Payload recebido:", JSON.stringify(body));
    const event = body?.event || body?.type || query?.event || "";
    const txData = body?.data || body?.transaction || body;
    const externalId = txData?.external_id || body?.external_id || query?.external_id || body?.data?.external_id;
    const pixupTxId = txData?.transaction_id || txData?.id || body?.transaction_id || query?.["data.id"] || query?.id;
    const status = (txData?.status || body?.status || "").toLowerCase();
    const isConfirmed = event.includes("confirmed") || event.includes("approved") || event.includes("paid") || status === "completed" || status === "confirmed" || status === "approved" || status === "paid" || status === "success";
    if (isConfirmed && (externalId || pixupTxId)) {
      try {
        const { data: settingsData } = await supabase2.from("settings").select("data").eq("id", "global").single();
        const settings = settingsData && settingsData.data ? typeof settingsData.data === "string" ? JSON.parse(settingsData.data) : settingsData.data : null;
        const { data: transactions } = await supabase2.from("transactions").select("*").eq("status", "pending").eq("type", "deposit");
        if (transactions) {
          for (const tx of transactions) {
            const metadata = tx.metadata ? typeof tx.metadata === "string" ? JSON.parse(tx.metadata) : tx.metadata : {};
            const txPixupId = metadata?.pixupTransactionId || metadata?.mpPaymentId;
            const isMatch = externalId && String(tx.id) === String(externalId) || pixupTxId && txPixupId && String(txPixupId) === String(pixupTxId);
            if (isMatch) {
              await supabase2.from("transactions").update({ status: "completed" }).eq("id", tx.id);
              const { data: user } = await supabase2.from("users").select("balance, phone, name, email, referredBy, referralCounted").eq("id", tx.userId).single();
              if (user) {
                const bonus = metadata?.bonus || 0;
                const totalAdd = Number(tx.amount) + Number(bonus);
                await supabase2.from("users").update({ balance: (Number(user.balance) || 0) + totalAdd }).eq("id", tx.userId);
                if (user.referredBy && !user.referralCounted) {
                  const { data: referrer } = await supabase2.from("users").select("id, referrals, unlockFirstWithdrawal").eq("id", user.referredBy).single();
                  if (referrer) {
                    const newReferrals = (Number(referrer.referrals) || 0) + 1;
                    let unlockFirstWithdrawal = referrer.unlockFirstWithdrawal;
                    if (newReferrals >= (settings?.referralsForFirstWithdrawal || 3)) {
                      unlockFirstWithdrawal = true;
                    }
                    await supabase2.from("users").update({ referrals: newReferrals, unlockFirstWithdrawal }).eq("id", referrer.id);
                    await supabase2.from("users").update({ referralCounted: true }).eq("id", tx.userId);
                  }
                }
                try {
                  await sendDepositNotificationEmail({
                    amount: tx.amount,
                    bonus,
                    userPhone: user.phone,
                    userName: user.name,
                    userEmail: user.email,
                    transactionId: tx.id,
                    settings
                  });
                } catch (emailErr) {
                  console.warn("Erro ao enviar email de notifica\xE7\xE3o:", emailErr);
                }
                const alertThreshold = Number(settings?.adminDepositAlertThreshold || 100);
                if (Number(tx.amount) >= alertThreshold) {
                  try {
                    await supabase2.from("notifications").insert({
                      id: "notif_" + Date.now() + Math.random().toString(36).substring(2, 7),
                      title: `\u{1F6A8} Alerta: Dep\xF3sito Alto PixUP (R$ ${Number(tx.amount).toFixed(2)})`,
                      message: `Dep\xF3sito de R$ ${Number(tx.amount).toFixed(2)} confirmado via PixUP para ${user.name || user.email}.`,
                      type: "success",
                      createdAt: (/* @__PURE__ */ new Date()).toISOString()
                    });
                  } catch (notifErr) {
                    console.warn("Erro ao criar notifica\xE7\xE3o de dep\xF3sito:", notifErr);
                  }
                }
              }
              console.log(`[PixUP] Dep\xF3sito ${tx.id} conclu\xEDdo com sucesso para o usu\xE1rio ${tx.userId}`);
              break;
            }
          }
        }
      } catch (innerErr) {
        console.warn("Webhook inner error handled safely:", innerErr);
      }
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error caught safely:", error);
    return res.status(200).json({ success: true });
  }
};
app.all(["/webhook", "/api/webhook", "/api/webhooks/pixup", "/app/webhook"], handlePixupWebhook);
app.post("/api/notifications/deposit-approved", async (req, res) => {
  try {
    const { transactionId, amount, userPhone, userName, userEmail, bonus } = req.body || {};
    let settings = null;
    try {
      const { data: settingsData } = await supabase2.from("settings").select("data").eq("id", "global").single();
      if (settingsData && settingsData.data) {
        settings = typeof settingsData.data === "string" ? JSON.parse(settingsData.data) : settingsData.data;
      }
    } catch (e) {
      console.warn("Could not load settings in notification route:", e);
    }
    const sent = await sendDepositNotificationEmail({
      amount: Number(amount) || 0,
      bonus: Number(bonus) || 0,
      userPhone,
      userName,
      userEmail,
      transactionId,
      settings
    });
    return res.status(200).json({ success: true, sent });
  } catch (err) {
    console.error("Error in /api/notifications/deposit-approved:", err);
    return res.status(500).json({ error: err?.message || "Error sending email" });
  }
});
app.all("/api/payments/sync", async (req, res) => {
  try {
    const result = await syncAllPendingDeposits();
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in /api/payments/sync:", err);
    return res.status(200).json({ approvedCount: 0, error: err?.message || "Error syncing payments" });
  }
});
app.all("/api/payments/check-status", async (req, res) => {
  try {
    const paymentId = req.query?.paymentId || req.body?.paymentId;
    const txId = req.query?.txId || req.body?.txId;
    const userId = req.query?.userId || req.body?.userId;
    const result = await verifyAndApprovePayment(paymentId, txId, userId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in /api/payments/check-status:", err);
    return res.status(200).json({ approved: false, error: err?.message || "Error checking payment status" });
  }
});
app.all(["/api", "/api/index", "/api/health"], (req, res) => {
  res.json({ status: "ok", service: "LT JOGOS API", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});

// server/api_entry.ts
function handler(req, res) {
  const matched = req.headers["x-matched-path"] || req.headers["x-invoke-path"];
  if (matched && typeof matched === "string" && (matched.startsWith("/api") || matched.startsWith("/webhook") || matched.startsWith("/app/webhook"))) {
    req.url = matched;
  }
  return app(req, res);
}
export {
  handler as default
};
