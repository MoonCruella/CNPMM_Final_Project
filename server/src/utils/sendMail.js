import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Thêm dòng này
  auth: {
    user: 'ttnghia204@gmail.com',
    pass: 'byzf engd xbey rdkl',
  },
  tls: {
    rejectUnauthorized: false // Thêm dòng này để tránh lỗi SSL
  }
});

// Thêm verify connection để debug
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
      from: 'ttnghia204@gmail.com',
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