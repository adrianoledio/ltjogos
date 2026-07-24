import nodemailer from "nodemailer";

export async function sendDepositNotificationEmail(data: {
  amount: number;
  bonus?: number;
  userPhone?: string;
  userName?: string;
  userEmail?: string;
  transactionId?: string;
  settings?: any;
}) {
  const recipient = "lediotattoo@proton.me";
  const { amount, bonus = 0, userPhone, userName, userEmail, transactionId, settings } = data;

  const subject = `💰 Depósito Aprovado: R$ ${Number(amount).toFixed(2)} - Tel: ${userPhone || 'Sem Telefone'}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #111827; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #374151;">
      <h2 style="color: #10B981; margin-top: 0; font-size: 22px;">💰 Novo Depósito Aprovado!</h2>
      <p style="color: #9CA3AF; font-size: 14px;">Um depósito foi processado e aprovado com sucesso na plataforma LT JOGOS.</p>
      
      <div style="background-color: #1F2937; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; color: #E5E7EB; font-size: 14px;">
          <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">Valor do Depósito:</td>
            <td style="padding: 10px 0; color: #10B981; font-size: 20px; font-weight: bold; text-align: right;">
              R$ ${Number(amount).toFixed(2)} ${bonus ? `<span style="font-size: 12px; color: #F59E0B;">(+ R$ ${Number(bonus).toFixed(2)} Bônus)</span>` : ''}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">Telefone do Usuário:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #60A5FA; font-size: 16px; text-align: right;">
              ${userPhone || 'Não informado'}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">Nome do Usuário:</td>
            <td style="padding: 10px 0; text-align: right;">${userName || 'Usuário'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">Email do Usuário:</td>
            <td style="padding: 10px 0; text-align: right;">${userEmail || 'N/A'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #374151;">
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">ID da Transação:</td>
            <td style="padding: 10px 0; font-family: monospace; text-align: right;">${transactionId || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: #9CA3AF;">Data / Hora:</td>
            <td style="padding: 10px 0; text-align: right;">${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td>
          </tr>
        </table>
      </div>
      <p style="color: #6B7280; font-size: 12px; text-align: center; margin-bottom: 0;">Notificação Automática - Plataforma LT JOGOS</p>
    </div>
  `;

  // 1. Try Resend API if key is available
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
          subject: subject,
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

  // 2. Try SMTP via Nodemailer
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
        from: `LT JOGOS <${smtpUser}>`,
        to: recipient,
        subject: subject,
        html: htmlContent
      });

      console.log("Deposit notification email sent via SMTP to", recipient);
      return true;
    } catch (e) {
      console.warn("SMTP email attempt failed:", e);
    }
  }

  console.log(`[DEPOSIT NOTIFICATION EMAIL TO ${recipient}] Subject: "${subject}"`);
  return false;
}
