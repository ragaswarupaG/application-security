// const nodemailer = require('nodemailer');


// const transporter = nodemailer.createTransport({
//   service: 'gmail', 
//   auth: {
//     user: 'raga.tpgig2425@gmail.com',
//     pass: 'Ragaswarupa2006'
//   }
// });

// // Setup email data
// const mailOptions = {
//   from: 'raga.tpgig2425@gmail.com',
//   to: 'ragaswarupa.g@gmail.com',
//   subject: 'Test Email',
//   text: 'Hello world?',
//   html: '<b>Hello world?</b>'
// };

// // Send email
// transporter.sendMail(mailOptions, (error, info) => {
//   if (error) {
//     return console.log(error);
//   }
//   console.log('Message sent: %s', info.messageId);
// });


// const nodemailer = require('nodemailer');

// // Create a transporter object using the default SMTP transport
// const transporter = nodemailer.createTransport({
//   service: 'gmail', // Use 'gmail' for Gmail
//   auth: {
//     user: 'raga.tpgig2425@gmail.com', // Replace with your Gmail address
//     pass: 'Ragaswarupa2006' // Replace with your Gmail password
//   }
// });

// // Setup email data
// const mailOptions = {
//   from: 'raga.tpgig2425@gmail.com', // Sender address
//   to: 'ragaswarupa.g@gmail.com', // List of receivers
//   subject: 'Test Email', // Subject line
//   text: 'Hello world?', // Plain text body
//   html: '<b>Hello world?</b>' // HTML body
// };

// // Send email
// transporter.sendMail(mailOptions, (error, info) => {
//   if (error) {
//     return console.log('Error:', error);
//   }
//   console.log('Message sent: %s', info.messageId);
// });
