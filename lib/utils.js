Feedback =  new Mongo.Collection('feedback');

_.templateSettings = {
  interpolate: /\[(.+?)\]/g
};


if(Meteor.isClient){
    click = function click() {
        var rest = Array.prototype.slice.call(arguments, 0);
        return _.map(rest, function (selector) {
            return 'click ' + selector + ', touch ' + selector + ', touchend ' + selector;
        }).join(', ');
    };


}

joinFeedbacks = function joinFeedbacks(feedbacks) {
    return _.reduce(feedbacks, function(memo, feedback) { return memo.concat(feedback.qset); }, [] );
}

calculateTopWeak = function calculateTopWeak(feedbacks) {
    var score = calculateScore(joinFeedbacks(feedbacks), true);
    var skillsWithoutCategories = _.difference(_.keys(score.scored), _.keys(framework));
    var keys = _.chain(skillsWithoutCategories).filter(function(key){
        return score.total[key] > 0
    }).sortBy(function(key) { 
        return score.scored[key]/score.total[key];
    }).value();
    var result = {};
    result.top3 = _.map(_.last(keys, 3), function(skill){ return { skill: skill, text: i18n[skill] } });
    result.weak3 = _.map(_.first(keys, 3), function(skill){return { skill: skill, text: i18n[skill] } });
    return result;
}

calculateScore = function calculateScore(questions, nodivide){
    var data = _.chain(questions)
    .filter(function(question) { return question.answer; })
    .reduce(function (data, question) {
        if(!question.answer) {
            return data;
        }
        _.each(question.answers, function(answer){
            if(answer.skill){
                data.total[skill2category[answer.skill]]++;
                data.total[answer.skill]++;
            }
        });
        var answer = _.find(question.answers, function (answer) {
            return question.answer == answer._id;
        });
        if(answer.skill){
            data.scored[skill2category[answer.skill]]++;
            data.scored[answer.skill]++;
        }
        return data;
    }, { scored: _.clone(initialScore), total: _.clone(initialScore) }).value();

    if(nodivide)
        return data;

    return _.reduce(_.keys(initialScore), function(memo, key){
        if(data.total[key] > 0){
            memo[key] = data.scored[key] / data.total[key];
        }
        return memo;
    }, _.clone(initialScore));
}


validateEmail = function validateEmail(email) {
    var re = /\S+@\S+/i
    return re.test(email);
}

getUserName = function getUserName(profile){
    if(!profile) return "unknown";

    if(profile.firstName || profile.lastName) {
        return (profile.firstName || "") + " " + (profile.lastName || "")
    }

    if(profile.name) {
        return profile.name;
    }

    if(profile.emailAddress) return profile.emailAddress;

    return "unknown";
}

framework =  {
    'value': [
        'business_focused',
        'people_focused',
        'integrity',
        'trustful',
        'authenticity'
    ],
    'problem_solving': [
        'problem_analysis',
        'creative',
        'conceptual_thinking',
        'manage_conflict',
        'negotiation'
    ],
    'self_mgmt': [
        'self_learning',
        'efficient',
        'initiative',
        'stress_tolerance',
        'persistence'
    ],
    'team_work': [
        'assertive',
        'positive',
        'accept_critics',
        'respectful',
        'facilitation'
    ],
    'leadership': [
        'strategic',
        'delegation',
        'coaching',
        'committed',
        'empathy'
    ],
    'communication': [
        'listening',
        'presentation',
        'story_telling',
        'written_communication',
        'sociability'
    ]
};

skill2category =  {
    'business_focused' : 'value',
    'people_focused' : 'value',
    'integrity' : 'value',
    'trustful' : 'value',
    'authenticity'  : 'value',

    'problem_analysis': 'problem_solving',
    'creative': 'problem_solving',
    'conceptual_thinking': 'problem_solving',
    'manage_conflict': 'problem_solving',
    'negotiation': 'problem_solving', 

    'self_learning': 'self_mgmt',
    'efficient': 'self_mgmt',
    'initiative': 'self_mgmt',
    'stress_tolerance': 'self_mgmt',
    'persistence': 'self_mgmt', 

    'assertive': 'team_work',
    'positive': 'team_work',
    'accept_critics': 'team_work',
    'respectful': 'team_work',
    'facilitation': 'team_work', 

    'strategic': 'leadership',
    'delegation': 'leadership',
    'coaching': 'leadership',
    'committed': 'leadership',
    'empathy': 'leadership', 

    'listening': 'communication',
    'presentation': 'communication',
    'story_telling': 'communication',
    'written_communication': 'communication',
    'sociability': 'communication', 
};



initialScore =  {
    'value': 0,
    'problem_solving': 0,
    'self_mgmt': 0,
    'team_work': 0,
    'leadership': 0,
    'communication': 0,
    'business_focused': 0,
    'people_focused': 0,
    'integrity': 0,
    'trustful': 0,
    'authenticity': 0,
    'problem_analysis': 0,
    'creative': 0,
    'conceptual_thinking': 0,
    'manage_conflict': 0,
    'negotiation': 0,
    'self_learning': 0,
    'efficient': 0,
    'initiative': 0,
    'stress_tolerance': 0,
    'persistence': 0,
    'assertive': 0,
    'positive': 0,
    'accept_critics': 0,
    'respectful': 0,
    'facilitation': 0,
    'strategic': 0,
    'delegation': 0,
    'coaching': 0,
    'committed': 0,
    'empathy': 0,
    'listening': 0,
    'presentation': 0,
    'story_telling': 0,
    'written_communication': 0,
    'sociability': 0
};

i18n =  {
    'value': 'Value',
    'problem_solving':  'Desicion Making',
    'self_mgmt':  'Self management',
    'team_work':  'Team work',
    'leadership': 'Leadership' ,
    'communication': 'Communication' ,
    'business_focused':  'Business focused',
    'people_focused':  'People focused',
    'integrity':  'Integrity',
    'trustful':  'Trustful',
    'authenticity':  'Authenticity',
    'problem_analysis':  'Problem analysis',
    'creative':  'Creative',
    'conceptual_thinking':  'Conceptual thinking',
    'manage_conflict':  'Manage conflict',
    'negotiation':  'Negotiation',
    'self_learning':  'Self learner',
    'efficient': 'Efficient' ,
    'initiative':  'Initiative',
    'stress_tolerance':  'Resilient',
    'persistence':  'Persistence',
    'assertive':  'Assertive',
    'positive':  'Positive',
    'accept_critics':  'Accepts criticism',
    'respectful':  'Respectful',
    'facilitation':  'Facilitate',
    'strategic':  'Strategic',
    'delegation':  'Delegation',
    'coaching':  'Coaching',
    'committed':  'Commitment',
    'empathy':  'Empathy',
    'listening': 'Listening' ,
    'presentation':  'Presentation',
    'story_telling':  'Storytelling',
    'written_communication':  'Written communication',
    'sociability': 'Sociability' 
};

quizzy =  _.template("What do you like about [name]?");

genInitialQuestionSet = function genYouQuestionSet(name, answers, num){
    var questionText = quizzy({ 'name': name });
    if(name.toLowerCase() == "you") {
        questionText = "What is more true about You";
    }
    var answers = _.chain(answers).shuffle().reduce(function(memo, answer){
        //1 question for every skill
        if(_.some(memo, function(answer1) { return answer1.skill == answer.skill })){
            return memo;
        }
        var a = _.clone(answer);
        a.text = (_.template(a.text)({name: name}));
        return memo.concat(a);
    }, []).value();
    answers = _.last(answers, Math.min(num * 2, Math.floor(answers.length * 0.5) * 2) );
    var result = [];
    for(var i = 0; i < answers.length; i+=2) {
        result.push({ text : questionText, answers : [ answers[i], answers[i+1] ]});
    }
    //console.log("answers", answers.length, _.uniq(_.pluck(answers, 'skill')).length)
    return result;

}

genQuizQuestionSet =  function genInviteQuestionSet(name) {
    var questionText = quizzy({ 'name': name });
    var answers = _.chain(qdata.type1others).shuffle().reduce(function(memo, answer){
        //1 question for every skill
        if(_.some(memo, function(answer1) { return answer1.skill == answer.skill })){
            return memo;
        }
        var a = _.clone(answer);
        a.text = _.template(answer.text)({name: name});
        return memo.concat(a);
    }, []).value();
    answers = _.last(answers, Math.min(8, Math.floor(answers.length * 0.5) * 2) );
    var result = [];
    for(var i = 0; i < answers.length; i+=2) {
        result.push({ text : questionText, answers : [ answers[i], answers[i+1] ]});
    }

    var type3questions = _.chain(qdata.type3).shuffle().last(3).map(function(question){
        var q = _.clone(question);
        q.text = _.template(question.text)({name : name})
        _.each(q.answers, function(answer){
            answer.text = _.template(answer.text)({name : name})
        });
        return q;
    }).value();

    return _.shuffle(result.concat(type3questions));
};
