Router.route('/profile', function () {
    this.wait(Meteor.subscribe('feedback'));
    if(this.ready() && Feedback.findOne({ 'from': Meteor.userId() })){
        var myfeedback = Feedback.findOne({ 'from': Meteor.userId() });
        var data = { profile : Meteor.user().profile }
        data.myscore = calculateScore(myfeedback.qset) 

        var otherFeedback = Feedback.find({ '_id': { '$ne': Meteor.userId() } }).fetch();
        var joinedQset = _.reduce(otherFeedback, function(memo, feedback) { return memo.concat(feedback.qset); }, [] );

        var validAnswers = _.filter(joinedQset, function(question) { return question.answer });
        data.otherscore = calculateScore(joinedQset);
        data.enoughData = (validAnswers.length > 30);

        var allFeedback = Feedback.find({to: Meteor.userId()}).fetch();
        joinedQset = _.reduce(allFeedback, function(memo, feedback) { return memo.concat(feedback.qset); }, [] );
        var totalScore = calculateScore(joinedQset);
        var keys = _.sortBy(_.keys(totalScore), function(key) { return totalScore[key] })
        data.top3 = _.map(_.first(keys, 3), function(skill){ return { skill: skill, text: i18n[skill] } });
        data.weak3 = _.map(_.last(keys, 3), function(skill){return { skill: skill, text: i18n[skill] } });

        data.categories = _.map(_.keys(framework), function(category) {
            return {
                name : i18n[category],
                skills : _.map(framework[category], function(skill){
                    return {name : i18n[skill], value: Math.round(data.otherscore[skill] * 100) }
                })
            }
        })
        console.log("data", data);

        this.render('profile', { data : data});  
    } else {
        this.render('loading');
    }
}, { 'name': '/profile' });

Router.route('/profile/written-feedback', function () {
    return this.render('profileWrittenFeedback', {
        'data': function () { return Meteor.user(); }
    });
}, { 'name': '/profile/written-feedback' });

Router.route('/profile/skills', function () {
    return this.render('profileSkills', {
        'data': function () { return Meteor.user(); }
    });
}, { 'name': '/profile/skills' });

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
        Meteor.publish('feedback', function (from) {
            var query = { 'to': this.userId };
            from ? query.from = from : void 0;
            return Feedback.find(query);
        });
    });
}
