if (Meteor.isClient) {
  
    var par1 = 0.7;
    var par2 = 0.38;
    var par3 = 0.5;
    var par4 = 0.54;
    var par5 = 0.68;
    var par6 = 0.4;
  
    Template.profile.helpers({
      x1 : function() {return Math.round(150-150*par1)},
      y1 : function() {return Math.round(150-86.6*par1)},
      x2 : function() {return 150},
      y2 : function() {return Math.round(150-150*par2)},
      x3 : function() {return Math.round(150+150*par3)},
      y3 : function() {return Math.round(150-86.6*par3)},
      x4 : function() {return Math.round(150+150*par4)},
      y4 : function() {return Math.round(150+86.6*par4)},
      x5 : function() {return 150},
      y5 : function() {return Math.round(150+150*par5)},
      x6 : function() {return Math.round(150-150*par6)},
      y6 : function() {return Math.round(150+86.6*par6)},
    });
  
    Template.profileSkills.helpers({ 
      
    });

    Template.profileSkills.helpers({  
      skills: [
        { category: 'Value',
          skillSet: [
            {skill: 'Business focused', value: 20},
            {skill: 'People focused', value: 180},
            {skill: 'Integrity', value: 10},
            {skill: 'Trustful', value: 150},
            {skill: 'Authenticity', value: 80}
          ]
        },
        { category: 'Desicion Making',
          skillSet: [
            {skill: 'Problem analysis', value: 50},
            {skill: 'Creative', value: 120},
            {skill: 'Conceptual thinking', value: 50},
            {skill: 'Manage conflict', value: 12},
            {skill: 'Negotiation', value: 75}
          ]
        },
        { category: 'Self management',
          skillSet: [
            {skill: 'Self learner', value: 150},
            {skill: 'Efficient' , value: 120},
            {skill: 'Initiative', value: 50},
            {skill: 'Resilient', value: 120},
            {skill: 'Persistence', value: 190}
          ]
        },
        { category: 'Team work',
          skillSet: [
            {skill: 'Assertive', value: 6},
            {skill: 'Positive', value: 80},
            {skill: 'Accepts criticism', value: 20},
            {skill: 'Respectful', value: 180},
            {skill: 'Facilitate', value: 12 }
          ]
        },
        { category: 'Leadership' ,
          skillSet: [
            {skill: 'Strategic', value: 180},
            {skill: 'Delegation', value: 35},
            {skill: 'Coaching', value: 12},
            {skill: 'Commitment', value: 120},
            {skill: 'Empathy', value: 190}
          ]
        },
        { category: 'Communication ' ,
          skillSet: [
            {skill: 'Listening' , value: 12},
            {skill: 'Presentation', value: 134},
            {skill: 'Storytelling', value: 180},
            {skill: 'Written communication', value: 30},
            {skill: 'Sociability', value: 60}
          ]
        }
      ]
    });
    /*nQuestion = new ReactiveVar(0);  
  
    questions = new ReactiveVar([
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
      }
    ]);
  
    Template.quiz.helpers({ 
      currentQuestion: function () {
        return questions.get()[nQuestion.get()]
      },
      
      people: [
        {name: "Vladimir", img: "http://cdn.picturecorrect.com/wp-content/uploads/2014/03/vladimir-putin.jpg"},
        {name: "Ivan", img: "https://pbs.twimg.com/profile_images/2188074564/Screen_Shot_2012-05-03_at_10.35.23_PM.png"},
        {name: "Ohyoon", img: "https://pbs.twimg.com/profile_images/562180783272517634/fhyzflTJ_400x400.png"},
      ],
      
    });
  
    Template.quiz.events({
      'click .answer, touch .answer, click .skip, touch .skip': function (event) {
        if (questions.get()[nQuestion.get() + 1]) {
          nQuestion.set(nQuestion.get() + 1) 
        } else {nQuestion.set(0)}
        console.log("click!");
        console.log(nQuestion.get());
      },
    }); */
  
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
