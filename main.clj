
;(Router.route "/test" (fn [] (this.render :loading)))

(defmacro eg [& operations]
  nil)

; shortcuts
(eg
  (on-client 
    (console.log "hello world")
    (console.log "hello world2"))

  ;translates to
  (if Meteor.isClient
    (do
      (console.log "hello world")
      (console.log "hello world2")))

  (on-server
    (console.log "hello world")))

(defmacro on-client [& body]
  `(if Meteor.isClient
     (do ~@body)))

(defmacro on-server [& body]
  `(if Meteor.isServer
     (do ~@body)))


(eg 
  (route "/invite"
         (this.wait (Meteor.subscribe :connections))
         (this.render :invite))

  ;translates to
  (Router.route "/invite"
                (fn []
                  (this.wait (Meteor.subscribe :connections))
                  (this.render :invite))))


(defmacro route [path & body]
  `(Router.route ~path
                (fn [] ~@body)))

(eg
  (defm-event :invite "click button" [event template]
    (conosle.log "hello world"))
  ;translates to
  (Template.invite.events 
    { "click button" (fn [event template]
                       (console.log "hello world"))})


  (defm-helper :invite :test [])
  (Template.invite.helpers { "test" (fn [] )}))

(defmacro defm-event [template event & body]
  `(.events (get Template ~template) 
            (let [h {}] 
              (set! (get h ~event) (fn ~@body)) 
              h)))

(on-client
  (route "/invite"
         (this.wait (Meteor.subscribe :connections))
         (if (this.ready)
           (this.render :invite)
           (this.render :loading)))

  (def invite-status (new ReactiveVar :default))

  (defm-event :invite "click button" [event template]
    (invite-status.set :sending)
    (def email (.val (template.$ "input[name=email]")))

    (Meteor.call :invite email 
                 (fn [err result]
                   (if err
                     (invite-status.set :error)
                     (do 
                       (invite-status.set :sent)
                       (setInterval (fn [] (invite-status.set :default)) 1000)))
                   (console.log err result))))
  
  (defm-event :invite "click button" []
    (Router.go :/profile)
    )
  
  )

(eg
  (defm-server-method :invite [email]
    email)
  ;translates to
  (on-server
    (Meteor.methods
      { :invite 
       (fn [email]
         email
         )}))

  ;TODO
  (on-client
    (defn invite [email] callback
      (Meteor.call :invite email callback))))

(defmacro defm-server-method [name & body] 
  `(do
     (on-server
       (Meteor.methods (let [h {}] 
                         (set! (get h ~name) (fn ~@body)) 
                         h)))))


(defm-server-method :invite [email]
  email)
