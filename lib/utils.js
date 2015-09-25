Answers = new Mongo.Collection('answers');
Feedback =  new Mongo.Collection('feedback');

quizzy =  _.template('What is more true about <%= name %>?');

if(Meteor.isClient){
    click = function click() {
        var rest = Array.prototype.slice.call(arguments, 0);
        return _.map(rest, function (selector) {
            return 'click ' + selector + ', touch ' + selector + ', touchend ' + selector;
        }).join(', ');
    };


}

calculateScore = function calculateScore(questions){
    var data = _.chain(questions)
    .filter(function(question) { return question.answer; })
    .reduce(function (data, question) {
        _.each(question.answers, function(answer){
            data.total[answer.category]++;
            data.total[answer.skill]++;
        });
        var answer = _.find(question.answers, function (answer) {
            return question.answer == answer._id;
        });
        data.answered[answer.category]++;
        data.answered[answer.skill]++;
        return data;
    }, { answered: _.clone(initialScore), total: _.clone(initialScore) }).value();

    return _.reduce(_.keys(initialScore), function(memo, key){
        if(data.total[key] > 0){
            memo[key] = data.answered[key] / data.total[key];
        }
        return memo;
    }, _.clone(initialScore));
}

validateEmail = function validateEmail(email) {
    var re = /\S+@\S+/i
    return re.test(email);
}

getUserName = function getName(profile){
    if(!profile) return "unknown";

    if(profile.firstName || profile.lastName) {
        return (profile.firstName || "") + " " + (profile.lastName || "")
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

genQuestionSet =  function genQuestionSet(name, answers, num) {
    var num = (num || 15) * 2;
    var questionText = quizzy({ 'name': name });
    var answers = _.chain(answers).shuffle().reduce(function(memo, answer){
        //1 question for every skill
        if(_.some(memo, function(answer1) { return answer1.skill == answer.skill })){
            return memo;
        }
        return memo.concat(answer);
    }, []).last(num).value();
    answers = _.last(answers, Math.floor(answers.length * 0.5) * 2);
    var result = [];
    for(var i = 0; i < answers.length; i+=2) {
        result.push({ text : questionText, answers : [ answers[i], answers[i+1] ]});
    }
    //console.log("answers", answers.length, _.uniq(_.pluck(answers, 'skill')).length)
    return result;
};
