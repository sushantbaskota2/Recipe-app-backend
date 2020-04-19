const apiKey = process.env.SENDGRID_API_KEY;
const sgmail = require('@sendgrid/mail');

sgmail.setApiKey(apiKey);

const sendWelcomeEmail = (email, name) => {
    sgmail.send({
        to: email,
        from: 'recipe-app@sushantbaskota.com',
        subject: 'Thanks for joining in to our recipe app. ',
        text: `Welcome to the recipe app, ${name}. Let me know how you get along with the app.`
    });
};

const sendCancellationEmail = (email, name) => {
    sgmail.send({
        to: email,
        from: 'recipe-app@sushantbaskota.com',
        subject: 'Sorry to see you go from out recipe app',
        text: `Goodbye, ${name}. I hope we can see you back in our recipe app.`
    });
};

module.exports = { sendWelcomeEmail, sendCancellationEmail };
