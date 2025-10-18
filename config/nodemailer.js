const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();
// You can use Gmail or any SMTP service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // your Gmail app password
  },
});
// console.log({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER, // your Gmail address
//     pass: process.env.EMAIL_PASS, // your Gmail app password
//   },
// });

module.exports = transporter;
