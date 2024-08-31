import nodemailer from "nodemailer"

export const sendEmail = async (email, username) => {
    // console.log(options)
    const transporter = nodemailer.createTransport({
        service: process.env.SMPT_SERVICE,
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASS
        },
    });

    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: email,
        subject: "Welcome to Abdullah-X",
        html: WELCOME_EMAIL_TEMPLATE.replace("{userName}", username),
    };

    await transporter.sendMail(mailOptions);
}