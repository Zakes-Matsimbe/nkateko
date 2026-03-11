import { emailThemes } from "./emailThemes";

export const buildEmailTemplate = ({
  name,
  title,
  subtitle,
  message,
  type = "standard",
  buttonText,
  buttonLink,
  regards
}) => {

  const theme = emailThemes[type] || emailThemes.standard;

  const year = new Date().getFullYear();

  const button = buttonLink
    ? `
      <p style="text-align:center;margin:30px 0">
        <a href="${buttonLink}"
          style="display:inline-block;
          background:${theme.color};
          color:white;
          padding:14px 36px;
          border-radius:50px;
          text-decoration:none;
          font-weight:bold;
          box-shadow:0 4px 12px rgba(0,0,0,0.15)">
          ${buttonText || "Open Link"}
        </a>
      </p>
    `
    : "";

  const regardsBlock = `
    <p style="margin-top:30px;color:#555">
      ${regards ? regards : "Best regards,<br><strong>Bokamoso Educational Trust</strong>"}
    </p>
  `;

  return `
<div style="max-width:600px;margin:auto;font-family:Poppins,Arial,sans-serif;background:#f4f4f4;padding:40px">

<table width="100%" style="background:#ffffff;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,0.1);overflow:hidden">

<tr>
<td style="background:${theme.gradient};padding:50px;text-align:center;color:white">
<h1 style="margin:0;font-size:32px;font-weight:700;">${title}</h1>
<p style="margin:10px 0 0;font-size:18px;">${subtitle || ""}</p>
</td>
</tr>

<tr>
<td style="padding:40px;color:#333;line-height:1.6;font-size:16px">

<p>Hi <strong>${name}</strong>,</p>

${message}

${button}

${regardsBlock}

</td>
</tr>

<tr>
<td style="background:#f8f9fa;padding:20px;text-align:center;color:#555;font-size:14px">
© ${year} Bokamoso Educational Trust • All rights reserved
</td>
</tr>

</table>

</div>
`;
};