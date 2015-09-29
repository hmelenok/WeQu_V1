Router.route('/profile', function () {
    route.set("profile");
    this.layout('ScriptLayout');
    this.wait(Meteor.subscribe('feedback'));
    if(this.ready()){
        var myfeedback = Feedback.findOne({ 'from': Meteor.userId(), 'to' : Meteor.userId() });
        var data = { profile : Meteor.user().profile }
        data.myscore = calculateScore(myfeedback.qset) 

        var otherFeedback = Feedback.find({ 'from': { '$ne': Meteor.userId() }, 'to' : Meteor.userId() }).fetch();
        var joinedQset = _.reduce(otherFeedback, function(memo, feedback) { return memo.concat(feedback.qset); }, [] );

        var validAnswers = _.filter(joinedQset, function(question) { return question.answer });
        data.otherscore = calculateScore(joinedQset);
        data.enoughData = (validAnswers.length > 30);

        var allFeedback = Feedback.find({to: Meteor.userId()}).fetch();
        joinedQset = _.reduce(allFeedback, function(memo, feedback) { return memo.concat(feedback.qset); }, [] );
        var totalScore = calculateScore(joinedQset);
        var keys = _.sortBy(_.difference(_.keys(totalScore), _.keys(framework)), function(key) { return totalScore[key] })
        data.top3 = _.map(_.first(keys, 3), function(skill){ return { skill: skill, text: i18n[skill] } });
        data.weak3 = _.map(_.last(keys, 3), function(skill){return { skill: skill, text: i18n[skill] } });
        
        this.render('profile', { data : data});  
    } else {
        this.render('loading');
    }
}, { 'name': '/profile' });

Router.route('/profile/skills', function () {
    route.set("skills");
    this.layout('ScriptLayout');
    this.wait(Meteor.subscribe('feedback'));
    if(this.ready()){
        var data = { profile : Meteor.user().profile }
        var otherFeedback = Feedback.find({ 'from': { '$ne': Meteor.userId() }, 'to' : Meteor.userId() }).fetch();
        var joinedQset = _.reduce(otherFeedback, function(memo, feedback) { return memo.concat(feedback.qset); }, [] );

        var validAnswers = _.filter(joinedQset, function(question) { return question.answer });
        var otherscore = calculateScore(joinedQset);
        data.enoughData = (validAnswers.length > 15);

        data.categories = _.map(_.keys(framework), function(category) {
            return {
                name : i18n[category],
                category : category,
                skills : _.map(framework[category], function(skill){
                    return {name : i18n[skill], value: Math.round(otherscore[skill] * 100), skill: skill, category: category }
                })
            }
        })
        this.render('profileSkills', { data : data});  

    } else {
        this.render('loading');
    }
}, { 'name': '/profile/skills' });

Router.route('/profile/written-feedback', function () {
    route.set("feedback");
    this.layout('ScriptLayout');
    return this.render('profileWrittenFeedback', {
        'data': function () { return Meteor.user(); }
    });
}, { 'name': '/profile/written-feedback' });


dataForRadar =  function dataForRadar(score) {
    var radius = 150;
    var vertices = _.keys(framework)['length'];
    var i = 0;
    return _.object(_.map([
        'self_mgmt',
        'problem_solving',
        'team_work',
        'communication',
        'leadership',
        'value'
    ], function (key) {
        var len = score[key];
        var angle = Math.PI * 0.5 + i * (2 * Math.PI / vertices);
        i = 1 + i;
        return [
            key,
            Math.round(radius + Math.cos(angle) * radius * len) + ',' + Math.round(radius + Math.sin(angle) * radius * len)
        ];
    }));
};
if (Meteor.isClient){
    Template.radar.onCreated(function(){
        this.data.points = dataForRadar(this.data.score)
    })
}
if(Meteor.isServer) {
    Meteor.startup(function () {
        Meteor.publish('feedback', function () {
            var fb = Feedback.find({$or : [ {from : this.userId}, {to : this.userId} ]});
            var users = fb.map(function(fb){ return [fb.to, fb.from] });
            users = _.uniq(_.flatten(users));
            return [fb, Meteor.users.find({_id : {$in : users}}, {profile : 1})];
        });
    });
}
