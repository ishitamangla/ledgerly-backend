const nodemailer = require('nodemailer')

//my server use transporter to communicate with SMTP servers
const transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        type:'OAuth2',
        user:process.env.EMAIL_USER,
        clientId:process.env.CLIENT_ID,
        clientSecret:process.env.CLIENT_SECRET,
        refreshToken:process.env.REFRESH_TOKEN,
    },
});

//verify the connection configuration
//error and success are callback functions
//when nodemailer verifies it ,it either pass (error,null) || (null,success)
transporter.verify((error,success)=>{
    if(error){
        console.error('Error connecting to email server : ',error)
    }
    else{
        console.log('email server is ready to send messages',success);
    }
});

//function to send email
//body is in html form
const sendEmail = async (to,subject,text,html) =>{
    try{
        const info = await transporter.sendMail({
            from: `Backend-ledger <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log("message sent ",info.messageId);
        console.log('preview url : ',nodemailer.getTestMessageUrl(info));
    }catch(err){
        console.log('error sending email : ' ,err);
        throw err;
    }
};

async function sendRegistrationEmail(userEmail,name){
    const subject = "Welcome to Backend-Ledger!"
    const text =  `Hello ${name},
    Thank you for registration at Backend-Ledger.We are excited to have you on board!

    Best Regards,
    The Backend Ledger Team`
    const html = `<p>
    Hello ${name} ,<br><br>
    Thank you for registration at Backend-Ledger.We are excited to have you on board! <br>
    Best Regards,
    <br>
    The Backend Ledger Team</p>`

    await sendEmail(userEmail,subject,text,html);
}

async function sendTransactionEmail(userEmail,name,amount,toAccount){
    const subject = "transaction successful";
    const text = `Hello ${name},
    Your transaction of amount ${amount} to account ${toAccount} was successful.Best Regards
    The backend Ledger Team`;
    const html = `<p>Hello ${name}
    <br>Your transaction of amount ${amount} to account ${toAccount} was successful
    <br>Best Regards
    <br>Backend Ledger Team </p>`

    await sendEmail(userEmail,subject,text,html)
}

// async function sendtransactionFailureEmail(userEmail,name,amount,toAccount){
//     const subject = "Transaction Failed";
//     const text = `Hello ${name} 
//     Your transaction of amount ${amount} to account ${toAccount} has failed
//     Please try later
//     Best Regards
//     The Backend Ledger Team`
//     const html = `<p>Hello ${name}
//     <br>Your transaction of amount ${amount} to account ${toAccount} has failed
//     <br>Please try later
//     <br>Best Regards
//     <br>The Backend Ledger Team</p>`

//     await sendEmail(userEmail,subject,text,html)
// }


module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail
}