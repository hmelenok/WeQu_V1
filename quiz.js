if(Meteor.isClient) {
    Router.route('/quiz', function () {
        route.set("quiz");
        return this.render('loading');
    }, { 'name': '/quiz' });

    var questionDep =  new Tracker.Dependency();
    var currentQuestion = function currentQuestion(questions) {
        questionDep.depend();
        return _.find(questions, function (question) {
            return !_.has(question, 'answer') || !_.has(question, 'written');
        });
    };
    Template['quiz'].helpers({
        'writtenFeedback' : function () {
            var question = currentQuestion(this.feedback.qset);
            !(this.feedback.to == this.feedback.from) && question && _.has(question, 'answer') && !_.has(question, 'written');
            return false;
        },
        'self' : function () {
            return this.feedback.from == this.feedback.to;
        },
        'question' : function () {
            return currentQuestion(this.feedback.qset);
        }
    });
    Template['quiz'].events({
        "click .answer, click .skip, click .writeAnswer" : function (event, template) {
            var feedback = template.data.feedback;
            var question = currentQuestion(feedback.qset);
            var buttonType = event.target.getAttribute('class');
            if(buttonType == 'answer') {
                question.answer = event.target.getAttribute('id');
                question.written = false;
            }
            if(buttonType == 'skip'){
                if(_.has(question, 'answer')) {
                    question.written = false
                } else {
                    question.answer = false
                }
            } 
            if(buttonType == 'writeAnswer') {
                question.written = template.$('textarea').val();
            }

            Meteor.call('feedback', feedback._id, feedback.qset, function (err, result) {
                console.log('feedback', err, result);
                if(currentQuestion(feedback.qset)) {
                    questionDep.changed()
                } else {
                    getLoginScript() ? setLoginScript('after-quiz') : void 0;
                    Session.get('invite') ? Session.setPersistent('invite', 'finish') : void 0;
                } 
            });
        }
    });
}

if(Meteor.isServer) {
    Meteor.methods({
        'feedback' : function (id, qset) {
            var selector = { '_id': id };
            return Feedback.update(selector, { '$set': { 'qset': qset } });
        }
    });
}
