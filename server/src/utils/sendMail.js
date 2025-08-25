import nodemailer from "nodemailer";
import { config } from "../config/env.js";


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Thêm dòng này
  auth: {
    user: config.email,
    pass: config.passEmail,
  },
  tls: {
    rejectUnauthorized: false // Thêm dòng này để tránh lỗi SSL
  }
});


transporter.verify(function(error, success) {
  if (error) {
    console.log("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is ready to send emails");
  }
});

const sendMail = async (to, subject, text) => {
  try {
    const result = await transporter.sendMail({
      from: config.email,
      to,
      subject,
      text,
    });
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Send mail error:", error);
    throw error;
  }
};

export default sendMail;