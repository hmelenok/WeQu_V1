if(Meteor.isClient){
    Router.route('/script-login', function () {
        this.layout('ScriptLayout');
        if(! Meteor.user()){
            this.render('loading')
            return;
        }

        var self = this;
        var phase = getLoginScript();
        switch(getLoginScript()) {
            case 'init': {
                this.render('scriptLoginInit')
                break;
            }
            case 'quiz': {
                Meteor.subscribe('feedback', Meteor.userId());
                if(this.ready() && Feedback.findOne({ 'from': Meteor.userId() })){
                    this.render('quiz', {
                        'data': {
                            'feedback': Feedback.findOne({ 'from': Meteor.userId() }),
                            'person': Meteor.user().profile
                        }
                    })                         
                } else {
                    this.render('loading');
                }
                break;
            }
            case 'profile' : {
                Meteor.subscribe('feedback', Meteor.userId());
                if(this.ready() && Feedback.findOne({ 'from': Meteor.userId(), 'to' : Meteor.userId() })) {
                    var myfeedback = Feedback.findOne({ 'from': Meteor.userId(), 'to' : Meteor.userId() });
                    var score = calculateScore(myfeedback.qset);

                    var keys = _.sortBy(_.keys(score), function(key) { return score[key] })
                    var top3 = _.map(_.first(keys, 3), function(skill){ return { skill: skill, text: i18n[skill] } });
                    var weak3 = _.map(_.last(keys, 3), function(skill){return { skill: skill, text: i18n[skill] } });
                    this.render('profile', {
                        'data': {
                            'myscore': score,
                            'top3' : top3,
                            'weak3' : weak3,
                            'profile': Meteor.user().profile
                        }
                    }) 
                } else { 
                    this.render('loading')
                }
                break;
            }

            case 'after-quiz' : 
                this.render('scriptLoginAfterQuiz')
            break;
            case 'invite' : 
                this.render('invite');
            break;
            case 'finish': 
                this.render('scriptLoginFinish');
            break
        }
    }, { 'name': '/script-login' });

    Template.scriptLoginInit.onCreated(function () {
        Meteor.call('gen-question-set', Meteor.userId(), function (err, result) {
            console.log('gen-question-set', err, result);
            setLoginScript('quiz');
        });
    });

    Template.registerHelper('inScript', function () {
        return getLoginScript();
    });

}
getLoginScript =  function getLoginScript() {
    if(Meteor.user())
        return Meteor.user().profile.loginScript
};
setLoginScript =  function setLoginScript(value) {
    Meteor.users.update(Meteor.userId(), { '$set': { 'profile.loginScript': value } });
};

if(Meteor.isClient){
    Template['scriptLoginAfterQuiz'].events({ 
        "click #next" : function () {
            setLoginScript('profile');
        }
    });
    Template['profile'].events({
        "click #finish" : function(){
            setLoginScript('invite');
            Router.go('/profile');
        }
    });
    Template['scriptLoginFinish'].events({
        'click #next' : function () {
            setLoginScript(false);
            return Router.go('/');
        }
    });
    Template['invite'].events({
        "click #next" : function () {
            return setLoginScript('finish');
        }
    });
}

genQuestionSet =  function genQuestionSet(name, answers) {
    var questionText = quizzy({ 'name': name });
    var answers = _.shuffle(answers);
    var questionSet = [];
    (function loop() {
        var recur = loop;
        do {
            recur = answers.length > 2 && questionSet.length < 30 ? (function () {
                questionSet.push({
                    'text': questionText,
                    'answers': [
                        answers.pop(),
                        answers.pop()
                    ]
                });
                return loop;
            })() : void 0;
        } while (recur === loop);
        return recur;
    }.call(this));
    return questionSet;
};
if(Meteor.isServer){
    Meteor.methods({
        'gen-question-set' : function (userId) {
            check(Meteor.userId(), String);
            var profile = Meteor.user().profile;
            var name = userId == Meteor.userId() ? 'you' : profile.firstName + ' ' + profile.lastName;
            qset = genQuestionSet(name, Answers.find({}).fetch());
            Feedback.upsert({
                'from': Meteor.userId(),
                'to': userId
            }, {
                'from': Meteor.userId(),
                'to': userId,
                'qset': qset,
                'score': initialScore
            });
            return qset;
        }
    });
};
