const nodemailer = require('nodemailer');

  module.exports = {
    sendEmail: (subject, message, email) => {
         // transporter used to connect the user and admin of the social network
         let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // is true for 465 otherwise false
            auth: {
                user: 'fortrecupsocial@gmail.com', // mail used by the social network
                pass: 'meowRS55' // password used by the social network
            },
/////////////!/ REMOVE THIS BEFORE PUSHING TO PROD //////////////////////
      //      tls:{ rejectUnauthorized:false  }
////////////////////////////////////////////////////////////////////////
        });//end create transport
        let mailOptions = {
            from: '<rs@projet3rs.com>', // sender adress, could be a fake address
            to: email, // list of receivers
            subject: subject, // Subject line
            text: message, // plain text body
            html: message // html body
        };
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            //console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        })//end transporter.sendMail
    }
  }//end export
