const express = require('express');
const app = express();

app.use(express.static('client'));
app.use(express.json());

app.get('/user/:userID', function (req, resp) {
	const userID = req.params.userID;
	resp.json({ userID: userID, userName: 'Test Name ' + userID });
});

module.exports = app;
