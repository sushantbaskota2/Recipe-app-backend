const mongoose = require('mongoose');

mongoose.connect(
    `mongodb+srv://admin:${encodeURIComponent(
        'olemiss2020'
    )}@cluster0-5cbzb.mongodb.net/test?retryWrites=true&w=majority`,
    {
        useNewUrlParser: true,
        useCreateIndex: true
    }
);
