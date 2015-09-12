if (Meteor.isClient) {

    Router.onBeforeAction(function () {
        if (!Meteor.userId()) {
            this.render('login');
        } else {
            this.next();
        }
    });

    Router.route('/', function(){
        this.render("quiz");
    });

    Router.route('/profile', function(){
        this.render("profile", {data : function(){
            return Meteor.user();
        }});
    });

    Router.route('/quiz', function(){
        this.render("quiz");
    });

    Template.invite.helpers({
        /*connections : function(){
            return Connections.find({});
        }*/
    });

    Template.quiz.events({
        "click button" : function(){
            Router.go("/invite")
        }
    });
    
    nQuestion = new ReactiveVar(0);  
  
    Template.quiz.helpers({ 
      nQuestion: nQuestion.get(),
    
      people: [
        {name: "Vladimir", img: "http://cdn.picturecorrect.com/wp-content/uploads/2014/03/vladimir-putin.jpg"},
        {name: "Ivan", img: "https://pbs.twimg.com/profile_images/2188074564/Screen_Shot_2012-05-03_at_10.35.23_PM.png"},
        {name: "Ohyoon", img: "https://pbs.twimg.com/profile_images/562180783272517634/fhyzflTJ_400x400.png"},
      ],
      
      questions: [
        {question: "What do you think about him?", 
          answers: [
            {number: "1", answer: "Dictator" },
            {number: "2", answer: "Tiran" },
            {number: "3", answer: "Model" },
            {number: "4", answer: "Very good guy" }
          ]
        },
        {question: "What do you think?", 
          answers: [
            {number: "1", answer: "rrrr" },
            {number: "3", answer: "Rain" },
            {number: "4", answer: "A lot" }
          ]
        },
        {question: "Yes or No?", 
          answers: [
            {number: "1", answer: "Yes" },
            {number: "2", answer: "No" },
          ]
       },
      ]
    });
  
    Template.registerHelper("case", function(){
        var pair =_.chain(this).pairs().first().value();

        var key = pair[0];
        var value = pair[1];

        var pdata = Template.parentData(1);
        _.extend(this, pdata);

        if(pdata && pdata[key] && pdata[key] == value) {
            return Template._case_default;
        }
        var rvar = window[key];
        if(!rvar){
            rvar = window[key] = new ReactiveVar("default");
        }
        if(rvar instanceof ReactiveVar && rvar.get() == value) {
            return Template._case_default;
        }
        return null;
    });

    _.chain(this).pairs().filter(function(pair){
        return (pair[1] instanceof ReactiveVar);
    }).each(function(pair){
        Template.registerHelper(pair[0], function(){
            return pair[1].get();
        });
    });

}
Connections = new Mongo.Collection("connections");

if (Meteor.isServer) {
  Meteor.startup(function () {
      Meteor.publish("connections", function(){
          //make linkedin api call
          if(this.userId) {
              //make api call
              //this.added("connections", 1, {firstName : "Ilya Ovdin"});
          } 
          this.ready();
      });
    // code to run on server at startup
  });
}
