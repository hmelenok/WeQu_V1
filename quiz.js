if(Meteor.isClient) {
    quizPersonIndex = new ReactiveVar(0)
    Router.route('/quiz', function(){
        route.set("quiz");
        this.wait(Meteor.subscribe('feedback'));
        if(!this.ready()) {
            this.render('loading');
            return;
        }
        var feedbacks = Feedback.find().fetch()
        var passed = _.chain(feedbacks).map(function(feedback){
            var question = currentQuestion(feedback.qset);
            // do not show friends that you've evaluated 
            if(!question && feedback.from == Meteor.userId()) return feedback.to; 
        }).compact().value()
        var friends =  _.chain(feedbacks).map(function(feedback){
            return [feedback.from, feedback.to];
        }).flatten().uniq().without(Meteor.userId()).difference(passed).sortBy().value();

        if(quizPersonIndex.get() >= friends.length && friends.length > 0) {
            quizPersonIndex.set(friends.length - 1);
        }
        if(friends.length == 0) {
            this.render('quizNothing');
            return;
        } 

        answering = false;
        var userId = friends[quizPersonIndex.get()];
        var data = { feedback : Feedback.findOne({to: userId }) }

        if(!data.feedback) {
            Meteor.call('gen-question-set', userId, function (err, result) {
                questionDep.changed();
                console.log('gen-question-set', err);
            });
        }
        var user = Meteor.users.findOne({_id : userId});
        if(user) data.person = user.profile;
        data.nextPerson = (quizPersonIndex.get() < friends.length - 1);
        data.prevPerson = (quizPersonIndex.get() > 0)

        this.render('quiz', {data : data});
    }, { 'name': '/quiz' });

    var questionDep =  new Tracker.Dependency();
    var currentQuestion = function currentQuestion(questions) {
        questionDep.depend();
        return _.find(questions, function (question) {
            return !_.has(question, 'answer');// || !_.has(question, 'written');
        });
    };

    Template.quiz.helpers({
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
        },
        'questionNum' : function(){
            questionDep.depend();
            var idx = 0
            _.find(this.feedback.qset, function (question) {
                idx++;
                return !_.has(question, 'answer');
            });
            return idx;

        }, 
        'questionsTotal' : function(){
            questionDep.depend();
            return this.feedback.qset.length;
        }
    });
    var answering = false;
    Template['quiz'].events({
        "click .answer, click .skip, click .writeAnswer" : function (event, template) {
            if(answering){
                return;
            }
            answering = true
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
                if(err) {
                    console.log('feedback error', err);
                }
                answering = false;
                questionDep.changed()
                if(!currentQuestion(feedback.qset)) {
                    if(Session.get('invite')){
                        Session.setPersistent('invite', 'filldata');
                    } else if(getLoginScript()) {
                        setLoginScript('after-quiz');
                    }
                } 
            });
        },
        "click #nextPerson" : function(){
            quizPersonIndex.set(quizPersonIndex.get() + 1);
        },
        "click #prevPerson" : function(){
            quizPersonIndex.set(quizPersonIndex.get() - 1);
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
