Router.route('/profile', function () {
    route.set("profile");
    this.layout('ScriptLayout');
    this.wait(Meteor.subscribe('feedback'));
    if(this.ready()){
        var myfeedback = Feedback.find({ 'from': Meteor.userId(), 'to' : Meteor.userId() }).fetch();
        var data = { profile : Meteor.user().profile };
        data.myscore = calculateScore(joinFeedbacks(myfeedback));

        var otherFeedback = Feedback.find({ 'from': { '$ne': Meteor.userId() }, 'to' : Meteor.userId() }).fetch();
        var qset = joinFeedbacks(otherFeedback);

        var validAnswers = _.filter(qset, function(question) { return question.answer });
        data.otherscore = calculateScore(qset);
        data.enoughData = (validAnswers.length > 30);

        _.extend(data, calculateTopWeak(Feedback.find({to: Meteor.userId()}).fetch()))
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
        var otherFeedback = Feedback.find({ 'to' : Meteor.userId() }).fetch();
        var joinedQset = joinFeedbacks(otherFeedback);

        var validAnswers = _.filter(joinedQset, function(question) { return question.answer });
        var otherscore = calculateScore(joinedQset, true);
        data.enoughData = (validAnswers.length > 15);

        data.categories = _.map(_.keys(framework), function(category) {
            return {
                name : i18n[category],
                category : category,
                skills : _.map(framework[category], function(skill){
                    var data = {name : i18n[skill], value: 0, scored: otherscore.scored[skill], total: otherscore.total[skill], skill: skill, category: category }
                    if(otherscore.total[skill] > 0) {
                        data.value = Math.round(otherscore.scored[skill] * 100 / otherscore.total[skill]);
                    }
                    return data;
                })
            }
        })
        this.render('profileSkills', { data : data });

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
    var radius = 120;
    var center = 150;
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
            Math.round(center + Math.cos(angle) * radius * len) + ',' + Math.round(center + Math.sin(angle) * radius * len)
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
            //var userList = fb.map(function(fb){ return [fb.to, fb.from] });
            //userList = _.uniq(_.flatten(users));
            //console.log("userList", userList);
            //var users = Meteor.users.find({_id : {$in : userList}}, {profile : 1});
            var users = Meteor.users.find({}, {profile : 1})
            return [fb, users];
        });
    });
}
