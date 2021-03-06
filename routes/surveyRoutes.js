const _ = require('lodash');
const Path = require('path-parser').default;
const { URL } = require('url');
const mongoose = require ('mongoose');
const Mailer = require('../services/Mailer');
const surveyTemplate = require('../services/emailTemplates/surveyTemplate');
const requireLogin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).send({ error: 'You must log in!' });
    }
    next();
};
const requireCredits = (req, res, next) => {
    if (req.user.credits < 1) {
        return res.status(403).send({ error: 'Not enough credits!' });
    }
    next();
};


const Survey = mongoose.model('surveys');

module.exports = app => {
    
    app.get('/api/surveys', requireLogin, async (req, res) => {
        const surveys = await Survey.find({ _user: req.user.id })
            .select({ recipients: false });

        res.send(surveys);
    });

    app.get('/api/surveys/:surveyId/:choice', (req,res) => {
        res.send('Thanks for voting!');
    });

    app.post('/api/surveys/webhooks', (req, res) => {
        const p = new Path('/api/surveys/:surveyId/:choice');

        _.chain(req.body)
            .map(({ email, url }) => {
                const match = p.test(new URL(url).pathname);
                if (match) {
                    return { email, surveyId: match.surveyId, choice: match.choice };
                }
            })
            .compact()
            .uniqBy('email', 'surveyId')
            .each(({ surveyId, email, choice }) => {
                Survey.updateOne(
                    {
                        _id: surveyId,
                        recipients: {
                            $elemMatch: { email: email, responded: false }
                        }
                    },
                    {
                        $inc: { [choice]: 1 },
                        $set: { 'recipients.$.responded': true },
                        lastResponded: new Date()                        
                    }
                ).exec();
            })
            .value();

        res.send({});
    });

    app.post('/api/surveys', requireLogin, requireCredits, async function (req, res) {
        const { title, subject, body, recipients } = req.body;
        const survey = new Survey({
            title,
            body,
            subject,
            recipients: recipients.split(',').map(email => ({ email: email.trim() })),
            _user: req.user.id,
            dateSent: Date.now()
        });
        const mailer = new Mailer(survey, surveyTemplate(survey));

        try {
            await mailer.send();
            await survey.save();
            req.user.credits -= 1;
            const user = await req.user.save();

            res.send(user);
        } catch (err){
            res.status(422).send(err);
        }
   });
};